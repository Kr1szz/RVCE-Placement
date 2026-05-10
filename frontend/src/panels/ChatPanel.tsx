import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare } from 'lucide-react'

export function ChatPanel() {
  const { repo, session } = useAuth()
  const { showToast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await repo.getMessages()
      setMessages([...res.messages].reverse())
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [repo])

  useEffect(() => {
    void load()
  }, [load])

  const send = async () => {
    const t = text.trim()
    if (!t) return
    setSending(true)
    try {
      const msg = await repo.sendMessage(t)
      setMessages((m) => [...m, msg])
      setText('')
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] pb-20 lg:pb-8">
      <Card className="h-full border-white/10 bg-white/5 backdrop-blur-xl flex flex-col">
        <CardHeader className="pb-4 border-b border-white/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Global Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {err ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 p-4">
              <p className="text-red-400">{err}</p>
              <Button variant="outline" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender.id === session?.user.id
                      return (
                        <div
                          key={m.id}
                          className={`max-w-[85%] ${mine ? 'ml-auto' : 'mr-auto'}`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              mine
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-white'
                            }`}
                          >
                            <p className="text-xs opacity-70 mb-1">
                              {m.sender.name} • {new Date(m.createdAt).toLocaleString()}
                            </p>
                            <p className="text-sm">{m.messageText}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/10 flex gap-3">
                <Input
                  placeholder="Type a message..."
                  value={text}
                  disabled={sending || !!err}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  disabled={sending || !!err || !text.trim()}
                  onClick={() => void send()}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}