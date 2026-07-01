import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side only — safe to use in 'use client' components
export const createClient = () => createClientComponentClient()
