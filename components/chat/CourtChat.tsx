'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { CourtChatMessage } from '@/types'
import { useAuth } from '@/components/layout/AuthProvider'
import { Send, LogIn } from 'lucide-react'
import Link from 'next/link'
import { formatChatTime, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Props = { courtId: string }

export default function CourtChat({ courtId }: Props) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<CourtChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`court-chat-${courtId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'court_chat_messages',
          filter: `court_id=eq.${courtId}`,
        },
        async (payload) => {
          // Fetch with profile info
          const { data } = await supabase
            .from('court_chat_messages')
            .select('*, profile:profiles(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) setMessages((prev) => [...prev, data as any])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [courtId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('court_chat_messages')
      .select('*, profile:profiles(*)')
      .eq('court_id', courtId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (data) setMessages(data as any)
  }

  const sendMessage = async () => {
    if (!text.trim() || !user) return
    setSending(true)
    await supabase.from('court_chat_messages').insert({
      court_id: courtId,
      user_id: user.id,
      content: text.trim(),
    })
    setText('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="flex flex-col gap-3 min-h-[300px] max-h-[400px] overflow-y-auto py-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-12 text-court-text text-sm text-center">
            Nema poruka još.<br />Budi prvi koji piše!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === user?.id
          return (
            <div
              key={msg.id}
              className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-500 overflow-hidden">
                {msg.profile?.avatar_url ? (
                  <img src={msg.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  msg.profile ? getInitials(msg.profile.full_name, msg.profile.username) : '?'
                )}
              </div>
              {/* Bubble */}
              <div className={cn(
                'max-w-[78%] rounded-2xl px-3.5 py-2.5',
                isOwn
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-court-card border border-court-border rounded-bl-sm'
              )}>
                {!isOwn && (
                  <p className="text-[10px] font-semibold text-orange-400 mb-0.5">
                    {msg.profile?.username ?? 'Nepoznat'}
                  </p>
                )}
                <p className="text-sm leading-snug">{msg.content}</p>
                <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-white/60' : 'text-court-text')}>
                  {formatChatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {user ? (
        <div className="flex gap-2 mt-4 pt-4 border-t border-court-border">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Poruka..."
            className="input-dark flex-1"
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-11 h-11 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all active:scale-90"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <Link
          href="/auth/login"
          className="mt-4 pt-4 border-t border-court-border flex items-center justify-center gap-2 text-court-text text-sm hover:text-orange-500 transition-colors py-3"
        >
          <LogIn className="w-4 h-4" />
          Prijavi se da bi pisao u chat
        </Link>
      )}
    </div>
  )
}
