import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatPanel() {
  const { repo, session } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const send = async () => {
    const t = text.trim()
    if (!t) return
    setSending(true)
    try {
      const msg = await repo.sendMessage(t)
      setMessages((m) => [...m, msg])
      setText('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] pb-20 lg:pb-8">
      <Card className="h-full border-white/10 bg-white/5 backdrop-blur-xl flex flex-col overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Global Discussion
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
          {err ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
              <div className="space-y-1">
                <p className="font-semibold text-white">Connection Error</p>
                <p className="text-sm text-text-muted">{err}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex flex-col gap-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={cn("max-w-[80%] space-y-1", i % 2 === 0 ? "ml-auto" : "")}>
                          <div className="h-10 w-48 bg-white/5 rounded-2xl animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-text-muted">
                      <Clock className="w-10 h-10 mb-2 opacity-20" />
                      <p>No messages in the thread yet.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender.id === session?.user.id
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex flex-col max-w-[85%] space-y-1",
                            isMe ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                              {isMe ? 'You' : m.sender.name}
                            </span>
                            <span className="text-[10px] text-white/30">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "px-4 py-2.5 rounded-2xl text-sm shadow-lg",
                              isMe 
                                ? "bg-primary text-white rounded-tr-none shadow-primary/20" 
                                : "bg-white/10 text-white rounded-tl-none shadow-black/20"
                            )}
                          >
                            {m.messageText}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-white/10 bg-white/5">
                <form 
                  className="flex w-full gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void send()
                  }}
                >
                  <Input
                    placeholder="Write a message..."
                    value={text}
                    disabled={sending || !!err}
                    onChange={(e) => setText(e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus:ring-primary/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={sending || !!err || !text.trim()}
                    className="shrink-0 shadow-lg shadow-primary/20"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}