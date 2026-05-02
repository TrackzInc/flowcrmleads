import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Trigger an automation for a contact - creates a run row that will be processed by automation-engine
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
    const { trigger_type, contact_id, extra } = await req.json();
    if (!trigger_type || !contact_id) return new Response(JSON.stringify({ error: 'trigger_type and contact_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: automations } = await supabase
      .from('automations')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('trigger_type', trigger_type)
      .eq('active', true);

    const created = [];
    for (const a of automations || []) {
      const { data: run } = await supabase.from('automation_runs').insert({
        user_id: userData.user.id,
        automation_id: a.id,
        contact_id,
        current_step: 0,
        status: 'pending',
        next_run_at: new Date().toISOString(),
      }).select().single();
      if (run) created.push(run.id);
    }

    return new Response(JSON.stringify({ runs_created: created.length, run_ids: created }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});