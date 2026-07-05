import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: reputation }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    supabase.from('user_reputation').select('*').eq('user_id', session.user.id).single(),
  ])

  return NextResponse.json({ profile, reputation })
}

export async function PATCH(request: NextRequest) {
  const supabase = createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, username, bio } = await request.json()

  if (username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', session.user.id)
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'Username zauzet' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, username, bio, updated_at: new Date().toISOString() })
    .eq('id', session.user.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
