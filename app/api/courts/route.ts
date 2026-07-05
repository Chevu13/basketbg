import { createRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createRouteClient()
  const { searchParams } = new URL(request.url)
  const approved = searchParams.get('approved') !== 'false'

  const { data, error } = await supabase
    .from('courts')
    .select(`
      *,
      followers:court_followers(count),
      gatherings:gatherings(id, gathering_time, is_active)
    `)
    .eq('is_approved', approved)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: { session } } = await supabase.auth.getSession()
  let followedIds: string[] = []
  if (session) {
    const { data: follows } = await supabase
      .from('court_followers')
      .select('court_id')
      .eq('user_id', session.user.id)
    followedIds = (follows ?? []).map((f: any) => f.court_id)
  }

  const enriched = (data ?? []).map((c: any) => ({
    ...c,
    followers_count: c.followers?.[0]?.count ?? 0,
    active_gatherings: c.gatherings?.filter((g: any) => g.is_active).length ?? 0,
    is_following: followedIds.includes(c.id),
  }))

  return NextResponse.json({ data: enriched })
}
