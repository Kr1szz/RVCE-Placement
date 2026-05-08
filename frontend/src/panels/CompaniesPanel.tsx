import { useCallback, useEffect, useState } from 'react'
import type { Company } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Building2, Calendar, IndianRupee, Star, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export function CompaniesPanel() {
  const { repo } = useAuth()
  const { showToast } = useToast()
  const [companies, setCompanies] = useState<Company[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<Set<number>>(() => new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      setCompanies(await repo.getCompanies())
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setCompanies(null)
    } finally {
      setLoading(false)
    }
  }, [repo])

  useEffect(() => {
    void load()
  }, [load])

  const updateCompany = async (
    company: Company,
    patch: { consent?: boolean; tracker?: boolean },
  ) => {
    setBusy((b) => new Set(b).add(company.id))
    try {
      await repo.saveApplication(company.id, patch)
      setCompanies(await repo.getCompanies())
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy((b) => {
        const n = new Set(b)
        n.delete(company.id)
        return n
      })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    )
  }

  if (err || !companies) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load companies</h3>
          <p className="text-sm text-slate-500 mb-4">{err ?? 'An unknown error occurred.'}</p>
          <Button onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">No companies yet</h3>
        <p className="text-slate-500">Stay tuned for upcoming placement drives.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {companies.map((c) => {
        const isBusy = busy.has(c.id)
        return (
          <Card key={c.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{c.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Min CGPA: {c.minCgpa.toFixed(1)}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  Drive Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <IndianRupee className="w-3 h-3" /> Package
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{c.package || 'TBD'}</p>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <IndianRupee className="w-3 h-3" /> Stipend
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{c.stipend || 'TBD'}</p>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" /> Test Date
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{formatDate(c.testDate ?? null)}</p>
                </div>
                <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" /> Interview
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{formatDate(c.interviewDate ?? null)}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`consent-${c.id}`} className="text-sm font-semibold">Consent Provided</Label>
                    <p className="text-xs text-slate-500">Willing to sit for this drive?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.consent && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <Switch
                      id={`consent-${c.id}`}
                      checked={c.consent ?? false}
                      onCheckedChange={(v) => void updateCompany(c, { consent: v })}
                      disabled={isBusy}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`tracker-${c.id}`} className="text-sm font-semibold">Mail Tracker</Label>
                    <p className="text-xs text-slate-500">Received email from company?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.tracker && <Mail className="w-4 h-4 text-primary" />}
                    <Switch
                      id={`tracker-${c.id}`}
                      checked={c.tracker ?? false}
                      onCheckedChange={(v) => void updateCompany(c, { tracker: v })}
                      disabled={isBusy}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
