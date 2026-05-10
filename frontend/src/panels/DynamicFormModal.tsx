import { useMemo, useState } from 'react'
import type { PlacementFormDetail } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from '@/components/ui/scroll-area'

export function DynamicFormModal({
  detail,
  onClose,
  onSubmitted,
}: {
  detail: PlacementFormDetail
  onClose: () => void
  onSubmitted: () => void
}) {
  const { repo } = useAuth()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const initial = useMemo(() => {
    const m: Record<number, string> = {}
    for (const q of detail.questions) {
      m[q.id] = q.answer ?? ''
    }
    return m
  }, [detail.questions])

  const [values, setValues] = useState<Record<number, string>>(initial)

  const setVal = (id: number, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }))
  }

  const submit = async () => {
    const answers: Record<number, string | number | boolean> = {}
    for (const q of detail.questions) {
      const raw = values[q.id] ?? ''
      if (q.fieldType === 'number') {
        const n = Number.parseFloat(raw)
        answers[q.id] = Number.isNaN(n) ? raw : n
      } else if (q.fieldType === 'boolean') {
        answers[q.id] = raw === 'true'
      } else {
        answers[q.id] = raw
      }
    }

    if (detail.questions.some((q) => q.isRequired && !(values[q.id] ?? '').trim())) {
      showToast('Please fill all required fields.')
      return
    }

    setSaving(true)
    try {
      await repo.submitFormResponses(detail.summary.id, answers)
      showToast('Responses submitted successfully.')
      onSubmitted()
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/10 text-white sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <DialogTitle className="text-2xl text-white">{detail.summary.title}</DialogTitle>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 text-[10px] uppercase font-bold">
              {detail.summary.type}
            </Badge>
          </div>
          <DialogDescription className="text-text-muted">
            {detail.summary.companyName ?? 'Global Placement Form'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 pb-6">
            {detail.questions.map((q) => (
              <div key={q.id} className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-1 text-white">
                  {q.questionText}
                  {q.isRequired && <span className="text-red-400">*</span>}
                </Label>
                
                {q.fieldType === 'text' || q.fieldType === 'number' ? (
                  <Input
                    type={q.fieldType === 'number' ? 'number' : 'text'}
                    value={values[q.id] ?? ''}
                    onChange={(e) => setVal(q.id, e.target.value)}
                    placeholder={`Enter ${q.questionText.toLowerCase()}...`}
                    className="bg-white/5 border-white/10 text-white focus:ring-primary/50"
                  />
                ) : q.fieldType === 'boolean' ? (
                  <Select
                    value={values[q.id]}
                    onValueChange={(v) => setVal(q.id, v)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={values[q.id]}
                    onValueChange={(v) => setVal(q.id, v)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose one..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {q.options.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-white/5 border-t border-white/10">
          <Button variant="ghost" onClick={onClose} disabled={saving} className="text-white hover:bg-white/5">
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={saving} className="bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20">
            {saving ? 'Submitting...' : 'Submit Responses'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}