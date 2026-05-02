import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function renderTemplate(tpl: string, vars: Record<string, any>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
}

// Processes pending automation_runs - runs each step until a wait/delay or completion
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: runs } = await supabase
    .from('automation_runs')
    .select('*')
    .in('status', ['pending', 'running'])
    .lte('next_run_at', new Date().toISOString())
    .order('next_run_at', { ascending: true })
    .limit(20);

  let processed = 0;
  const results: any[] = [];

  for (const run of runs || []) {
    try {
      const { data: steps } = await supabase
        .from('automation_steps')
        .select('*')
        .eq('automation_id', run.automation_id)
        .order('step_order', { ascending: true });
      const { data: contact } = await supabase.from('contacts').select('*').eq('id', run.contact_id).single();

      if (!contact || !steps || steps.length === 0) {
        await supabase.from('automation_runs').update({ status: 'completed' }).eq('id', run.id);
        continue;
      }

      const step = steps[run.current_step];
      if (!step) {
        await supabase.from('automation_runs').update({ status: 'completed' }).eq('id', run.id);
        continue;
      }

      const vars = { nome: contact.name, email: contact.email, telefone: contact.phone, empresa: contact.origin };
      const cfg = step.action_config || {};

      // Execute action
      if (step.action_type === 'send_email') {
        if (!contact.optin_email || !contact.email) {
          await supabase.from('message_logs').insert({
            user_id: run.user_id, contact_id: contact.id, automation_id: run.automation_id,
            channel: 'email', recipient: contact.email || '', status: 'error',
            error_message: !contact.optin_email ? 'sem opt-in' : 'sem email',
          });
        } else {
          const resendKey = Deno.env.get('RESEND_API_KEY');
          const subj = renderTemplate(cfg.subject || 'Mensagem', vars);
          const cont = renderTemplate(cfg.content || '', vars);
          let status = 'pending', err: string | null = null, sentAt: string | null = null;
          if (resendKey) {
            const r = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
              body: JSON.stringify({ from: 'FlowCRM <onboarding@resend.dev>', to: [contact.email], subject: subj, html: cont.replace(/\n/g, '<br>') }),
            });
            if (r.ok) { status = 'sent'; sentAt = new Date().toISOString(); } else { status = 'error'; err = await r.text(); }
          } else { err = 'RESEND_API_KEY não configurado'; }
          await supabase.from('message_logs').insert({
            user_id: run.user_id, contact_id: contact.id, automation_id: run.automation_id,
            channel: 'email', recipient: contact.email, subject: subj, content: cont,
            status, error_message: err, sent_at: sentAt,
          });
        }
      } else if (step.action_type === 'send_whatsapp') {
        const cont = renderTemplate(cfg.content || '', vars);
        await supabase.from('message_logs').insert({
          user_id: run.user_id, contact_id: contact.id, automation_id: run.automation_id,
          channel: 'whatsapp', recipient: contact.phone || '',
          content: cont,
          status: 'pending',
          error_message: contact.optin_whatsapp ? 'WhatsApp Twilio não configurado' : 'sem opt-in',
        });
      } else if (step.action_type === 'add_tag' && cfg.tag) {
        const newTags = Array.from(new Set([...(contact.tags || []), cfg.tag]));
        await supabase.from('contacts').update({ tags: newTags }).eq('id', contact.id);
      } else if (step.action_type === 'move_stage' && cfg.stage) {
        await supabase.from('contacts').update({ stage: cfg.stage }).eq('id', contact.id);
      } else if (step.action_type === 'create_task' && cfg.title) {
        await supabase.from('tasks').insert({
          user_id: run.user_id, contact_id: contact.id, title: renderTemplate(cfg.title, vars),
          due_date: cfg.due_date || new Date().toISOString().slice(0, 10),
        });
      }
      // 'wait' = no action, just delay

      // Advance to next step or complete
      const nextStepIndex = run.current_step + 1;
      if (nextStepIndex >= steps.length) {
        await supabase.from('automation_runs').update({ status: 'completed', current_step: nextStepIndex }).eq('id', run.id);
      } else {
        const nextStep = steps[nextStepIndex];
        const delayMs = (nextStep.delay_minutes || 0) * 60 * 1000;
        await supabase.from('automation_runs').update({
          current_step: nextStepIndex,
          next_run_at: new Date(Date.now() + delayMs).toISOString(),
          status: 'pending',
        }).eq('id', run.id);
      }
      processed++;
      results.push({ run_id: run.id, step: step.action_type });
    } catch (e: any) {
      await supabase.from('automation_runs').update({ status: 'error', last_error: e.message }).eq('id', run.id);
    }
  }

  return new Response(JSON.stringify({ processed, results }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});