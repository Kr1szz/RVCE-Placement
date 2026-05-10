import { useCallback, useEffect, useState } from 'react'
import type { PlacementFormDetail, PlacementFormSummary } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DynamicFormModal } from './DynamicFormModal'
import { FileText, Users, HelpCircle } from 'lucide-react'

export function FormsPanel() {
  const { repo } = useAuth()
  const { showToast } = useToast()
  const [forms, setForms] = useState<PlacementFormSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [detail, setDetail] = useState<PlacementFormDetail | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      setForms(await repo.getAssignedForms())
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setForms(null)
    } finally {
      setLoading(false)
    }
  }, [repo])

  useEffect(() => {
    void load()
  }, [load])

  const openForm = async (summary: PlacementFormSummary) => {
    try {
      const d = await repo.getForm(summary.id)
      setDetail(d)
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (err || !forms) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">{err ?? 'Failed to load forms.'}</p>
        <Button onClick={() => void load()}>Retry</Button>
      </div>
    )
  }

  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="p-4 rounded-full bg-white/5">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">No forms yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            SPC-created forms will appear here as soon as they are shared.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {detail ? (
        <DynamicFormModal
          detail={detail}
          onClose={() => setDetail(null)}
          onSubmitted={load}
        />
      ) : null}
      {forms.map((f) => (
        <Card key={f.id} className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{f.title}</CardTitle>
                <CardDescription className="text-white/60 mt-1">
                  {f.type.toUpperCase()} • {f.companyName ?? 'Global'}
                </CardDescription>
              </div>
              <Button
                onClick={() => void openForm(f)}
                className="shrink-0"
              >
                {(f.responseCount ?? 0) > 0 ? 'Edit' : 'Fill'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {f.questionCount ?? 0} Questions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {f.responseCount ?? 0} Responses
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}