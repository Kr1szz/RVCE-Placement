import { useCallback, useEffect, useState } from 'react'
import type { Company } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '../placement/format'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (err || !companies) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">{err ?? 'Failed to load companies.'}</p>
        <Button onClick={() => void load()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {companies.map((c) => {
        const isBusy = busy.has(c.id)
        return (
          <Card key={c.id} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{c.name}</CardTitle>
                  <CardDescription className="text-white/60 mt-1">
                    Package: {c.package || 'TBD'} • Stipend: {c.stipend || 'TBD'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={c.consent ? 'success' : 'secondary'}>
                    {c.consent ? 'Consent Given' : 'No Consent'}
                  </Badge>
                  {c.tracker && (
                    <Badge variant="warning">Mail Tracker</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Min CGPA</p>
                  <p className="text-lg font-semibold text-white">{c.minCgpa.toFixed(1)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Test Date</p>
                  <p className="text-lg font-semibold text-white">{formatDate(c.testDate)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 col-span-2 sm:col-span-1">
                  <p className="text-xs text-muted-foreground mb-1">Interview</p>
                  <p className="text-lg font-semibold text-white">{formatDate(c.interviewDate)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={c.consent ?? false}
                    disabled={isBusy}
                    onCheckedChange={(v) => void updateCompany(c, { consent: v })}
                  />
                  <span className="text-sm font-medium">Consent</span>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={c.tracker ?? false}
                    disabled={isBusy}
                    onCheckedChange={(v) => void updateCompany(c, { tracker: v })}
                  />
                  <span className="text-sm font-medium">Mail Tracker</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      {companies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No companies available yet</p>
        </div>
      )}
    </div>
  )
}