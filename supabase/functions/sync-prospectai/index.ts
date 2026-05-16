import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

   try {
     console.log('Iniciando sincronização ProspectAi...')
    const PROSPECTAI_URL = Deno.env.get('PROSPECTAI_URL')
    const PROSPECTAI_KEY = Deno.env.get('PROSPECTAI_SERVICE_ROLE_KEY') || Deno.env.get('PROSPECTAI_ANON_KEY')

     if (!PROSPECTAI_URL || !PROSPECTAI_KEY) {
       console.error('Configuração ausente: PROSPECTAI_URL ou PROSPECTAI_KEY não encontrados.')
      return new Response(
        JSON.stringify({ error: 'Configuração do ProspectAi ausente (URL ou Key)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const userId = body.user_id

     if (!userId) {
       console.error('Erro: user_id não fornecido no corpo da requisição.')
      return new Response(
        JSON.stringify({ error: 'user_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

     console.log(`Conectando ao ProspectAi em: ${PROSPECTAI_URL}`)
     const prospectClient = createClient(PROSPECTAI_URL, PROSPECTAI_KEY)
     
    const { data: leads, error: fetchError } = await prospectClient
      .from('leads')
      .select('*')

     if (fetchError) {
       console.error(`Erro ao buscar leads do ProspectAi: ${fetchError.message}`)
      return new Response(
        JSON.stringify({ error: `Erro ao buscar leads: ${fetchError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
     console.log(`Buscados ${leads?.length || 0} leads do ProspectAi.`)
     const supabase = createClient(supabaseUrl, supabaseKey)

    const mappedLeads = (leads || []).map(lead => ({
      user_id: userId,
      external_id: lead.id?.toString(),
      external_source: 'prospectai',
      name: lead.name || lead.company_name || 'Sem nome',
      phone: lead.phone || '',
      segmento: lead.segment || '',
      notes: lead.company_name ? `Empresa: ${lead.company_name}` : '',
      origin: 'ProspectAi',
      is_lead: true,
      status: 'novo',
      stage: 'novo_lead'
    }))

     if (mappedLeads.length === 0) {
        console.log('Nenhum lead para processar após o mapeamento.')
       return new Response(
        JSON.stringify({ success: true, count: 0, message: 'Nenhum lead encontrado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

     console.log(`Realizando upsert de ${mappedLeads.length} leads no Supabase local...`)
     const { data, error: upsertError } = await supabase
      .from('contacts')
      .upsert(mappedLeads, { 
        onConflict: 'user_id,external_source,external_id',
        ignoreDuplicates: false 
      })
      .select('id')

     if (upsertError) {
       console.error(`Erro ao salvar no Supabase local: ${upsertError.message}`)
      return new Response(
        JSON.stringify({ error: `Erro ao salvar leads: ${upsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

     console.log(`Sincronização finalizada com sucesso. ${data?.length || 0} registros afetados.`)
     return new Response(
      JSON.stringify({ success: true, count: data?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
