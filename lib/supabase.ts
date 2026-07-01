import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side (use in 'use client' components)
export const createClient = () => createClientComponentClient()

// Server-side (use in Server Components, Route Handlers)
export const createServerClient = () =>
  createServerComponentClient({ cookies })

// Route handlers
export const createRouteClient = () =>
  createRouteHandlerClient({ cookies })
