import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function renderTemplate(tpl: string, vars: Record<string, any>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabaseUser.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { contact_id, channel, subject, content, automation_id } = body;

    if (!contact_id || !channel || !content) {
      return new Response(JSON.stringify({ error: 'contact_id, channel, content required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: contact, error: cErr } = await supabase.from('contacts').select('*').eq('id', contact_id).eq('user_id', userData.user.id).single();
    if (cErr || !contact) return new Response(JSON.stringify({ error: 'contact not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Opt-in check
    if (channel === 'email' && !contact.optin_email) {
      return new Response(JSON.stringify({ error: 'Contato sem opt-in para Email' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (channel === 'whatsapp' && !contact.optin_whatsapp) {
      return new Response(JSON.stringify({ error: 'Contato sem opt-in para WhatsApp' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const recipient = channel === 'email' ? contact.email : contact.phone;
    if (!recipient) return new Response(JSON.stringify({ error: `Contato sem ${channel}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const vars = { nome: contact.name, email: contact.email, telefone: contact.phone, empresa: contact.origin };
    const renderedContent = renderTemplate(content, vars);
    const renderedSubject = subject ? renderTemplate(subject, vars) : null;

    let status = 'pending';
    let errorMessage: string | null = null;
    let sentAt: string | null = null;

    try {
      if (channel === 'email') {
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey) {
          const resp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
            body: JSON.stringify({
              from: 'FlowCRM <onboarding@resend.dev>',
              to: [recipient],
              subject: renderedSubject || 'Mensagem',
              html: renderedContent.replace(/\n/g, '<br>'),
            }),
          });
          if (resp.ok) { status = 'sent'; sentAt = new Date().toISOString(); }
          else { status = 'error'; errorMessage = await resp.text(); }
        } else {
          status = 'pending';
          errorMessage = 'Provedor de email não configurado (configure RESEND_API_KEY)';
        }
      } else if (channel === 'whatsapp') {
        // WhatsApp via Twilio - placeholder até conectar Twilio
        status = 'pending';
        errorMessage = 'WhatsApp via Twilio não configurado ainda';
      }
    } catch (e: any) {
      status = 'error';
      errorMessage = e.message;
    }

    const { data: log } = await supabase.from('message_logs').insert({
      user_id: userData.user.id,
      contact_id,
      automation_id: automation_id || null,
      channel,
      recipient,
      subject: renderedSubject,
      content: renderedContent,
      status,
      error_message: errorMessage,
      sent_at: sentAt,
    }).select().single();

    return new Response(JSON.stringify({ success: status === 'sent', status, log }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});