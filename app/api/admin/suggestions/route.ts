import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, action, admin_note } = await request.json()

  if (action === 'approve') {
    const { data: suggestion } = await supabase
      .from('court_suggestions')
      .select('*')
      .eq('id', id)
      .single()

    if (suggestion) {
      await supabase.from('courts').insert({
        name: suggestion.name,
        address: suggestion.address,
        lat: suggestion.lat,
        lng: suggestion.lng,
        description: suggestion.description,
        is_outdoor: suggestion.is_outdoor,
        surface: suggestion.surface,
        is_approved: true,
        created_by: suggestion.submitted_by,
      })

      await supabase.from('notifications').insert({
        user_id: suggestion.submitted_by,
        type: 'court_approved',
        title: 'Tvoj predlog odobren!',
        body: `${suggestion.name} je dodat na mapu BasketBG.`,
      })
    }
  }

  await supabase.from('court_suggestions')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', admin_note })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
