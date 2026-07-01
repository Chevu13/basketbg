import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, address, lat, lng, description } = body

  if (!name || !address || !lat || !lng)
    return NextResponse.json({ error: 'Nedostaju polja' }, { status: 400 })

  const { data, error } = await supabase
    .from('court_suggestions')
    .insert({ name, address, lat, lng, description, submitted_by: session.user.id })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
