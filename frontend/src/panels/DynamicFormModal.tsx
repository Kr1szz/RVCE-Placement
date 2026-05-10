import { useMemo, useState } from 'react'
import type { PlacementFormDetail } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

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
      if (q.fieldType === 'text' || q.fieldType === 'number') {
        m[q.id] = q.answer ?? ''
      } else if (q.fieldType === 'boolean') {
        m[q.id] = q.answer ?? ''
      } else {
        m[q.id] = q.answer ?? ''
      }
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
      onSubmitted()
      onClose()
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">{detail.summary.title}</DialogTitle>
            <Badge variant="secondary">{detail.summary.type.toUpperCase()}</Badge>
          </div>
          <DialogDescription>
            {detail.summary.companyName ?? 'Global'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {detail.questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-white">
                {q.questionText}
                {q.isRequired && <span className="text-red-400 ml-1">*</span>}
              </Label>
              {q.fieldType === 'text' || q.fieldType === 'number' ? (
                <Input
                  type={q.fieldType === 'number' ? 'number' : 'text'}
                  value={values[q.id] ?? ''}
                  onChange={(e) => setVal(q.id, e.target.value)}
                  placeholder={`Enter ${q.questionText.toLowerCase()}`}
                />
              ) : q.fieldType === 'boolean' ? (
                <Select
                  value={values[q.id] ?? ''}
                  onValueChange={(v) => setVal(q.id, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={values[q.id] ?? ''}
                  onValueChange={(v) => setVal(q.id, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {q.options.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit responses'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}