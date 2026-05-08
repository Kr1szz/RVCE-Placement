import { useCallback, useEffect, useState } from 'react'
import type { PlacementFormDetail, PlacementFormSummary } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DynamicFormModal } from './DynamicFormModal'
import { ClipboardList, MessageSquareText, FileQuestion, CheckCircle2, AlertCircle, Globe, Building } from 'lucide-react'

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
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    )
  }

  if (err || !forms) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load forms</h3>
          <p className="text-sm text-slate-500 mb-4">{err ?? 'An unknown error occurred.'}</p>
          <Button onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
        <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">All caught up!</h3>
        <p className="text-slate-500">No pending forms assigned to you at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {detail ? (
        <DynamicFormModal
          detail={detail}
          onClose={() => setDetail(null)}
          onSubmitted={load}
        />
      ) : null}
      
      <div className="grid grid-cols-1 gap-6">
        {forms.map((f) => (
          <Card key={f.id} className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {f.title}
                    {(f.responseCount ?? 0) > 0 && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {f.companyName ? (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" /> {f.companyName}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-primary">
                        <Globe className="w-3 h-3" /> Global
                      </span>
                    )}
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="uppercase font-semibold tracking-wider text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                      {f.type}
                    </span>
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => void openForm(f)}
                  variant={(f.responseCount ?? 0) > 0 ? "outline" : "default"}
                  className="gap-2"
                >
                  {(f.responseCount ?? 0) > 0 ? (
                    <>Update Response</>
                  ) : (
                    <>Fill Form</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <FileQuestion className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{f.questionCount ?? 0}</span>
                  <span className="text-slate-500">Questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquareText className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{f.responseCount ?? 0}</span>
                  <span className="text-slate-500">Responses</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
