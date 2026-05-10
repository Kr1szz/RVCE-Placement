import { useCallback, useEffect, useState } from 'react'
import type {
  Company,
  FormQuestion,
  FormResponseRecord,
  PlacementFormSummary,
  StudentSummary,
} from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { downloadBlob } from '../placement/format'
import { Building2, FileQuestion, FileText, Users, Download, Send, CheckCircle, Plus } from 'lucide-react'

const EXPORT_FIELDS: { key: string; label: string }[] = [
  { key: 'usn', label: 'USN' },
  { key: 'personal_email_id', label: 'Personal Email' },
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'aadhar', label: 'Aadhar' },
  { key: 'linkedIn', label: 'LinkedIn' },
  { key: 'gitHub', label: 'GitHub' },
  { key: 'tenth_marks', label: '10th Marks' },
  { key: 'twelfth_marks', label: '12th Marks' },
  { key: 'first_sem_sgpa', label: '1st Sem SGPA' },
]

type AdminData = {
  companies: Company[]
  questions: FormQuestion[]
  forms: PlacementFormSummary[]
  students: StudentSummary[]
}

export function AdminPanel() {
  const { repo } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [cName, setCName] = useState('')
  const [cCgpa, setCCgpa] = useState('')
  const [cPkg, setCPkg] = useState('')
  const [cStip, setCStip] = useState('')
  const [cTest, setCTest] = useState('')
  const [cInt, setCInt] = useState('')

  const [qText, setQText] = useState('')
  const [qType, setQType] = useState<'text' | 'number' | 'boolean' | 'dropdown'>(
    'text',
  )
  const [qOpts, setQOpts] = useState('')

  const [fTitle, setFTitle] = useState('')
  const [fType, setFType] = useState<'consent' | 'tracker' | 'custom'>('custom')
  const [fCompanyId, setFCompanyId] = useState<number | null>(null)
  const [mapFormId, setMapFormId] = useState<number | null>(null)
  const [mapped, setMapped] = useState<Record<number, boolean>>({})
  const [required, setRequired] = useState<Set<number>>(() => new Set())

  const [exportCompanyId, setExportCompanyId] = useState<number | null>(null)
  const [exportFields, setExportFields] = useState<Set<string>>(
    () => new Set(EXPORT_FIELDS.map((f) => f.key)),
  )

  const [responsesModal, setResponsesModal] = useState<{
    formId: number
    title: string
    rows: FormResponseRecord[]
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [companies, questions, forms, students] = await Promise.all([
        repo.getCompanies(),
        repo.getQuestions(),
        repo.getAllForms(),
        repo.getStudents(),
      ])
      setData({ companies, questions, forms, students })
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [repo])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (task: () => Promise<void>, ok?: string) => {
    setBusy(true)
    try {
      await task()
      await load()
      if (ok) showToast(ok)
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const createCompany = () =>
    run(async () => {
      await repo.createCompany({
        name: cName.trim(),
        minCgpa: Number.parseFloat(cCgpa) || 0,
        package: cPkg.trim(),
        stipend: cStip.trim(),
        testDate: cTest.trim() || null,
        interviewDate: cInt.trim() || null,
      })
      setCName('')
      setCCgpa('')
      setCPkg('')
      setCStip('')
      setCTest('')
      setCInt('')
    }, 'Company created.')

  const createQuestion = () =>
    run(async () => {
      const options = qOpts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await repo.createQuestion({
        questionText: qText.trim(),
        fieldType: qType,
        options: qType === 'dropdown' ? options : undefined,
      })
      setQText('')
      setQOpts('')
    }, 'Question created.')

  const createForm = () =>
    run(async () => {
      await repo.createForm({
        title: fTitle.trim(),
        type: fType,
        companyId: fCompanyId,
      })
      setFTitle('')
    }, 'Form created.')

  const saveMapping = () => {
    if (mapFormId == null) {
      showToast('Select a form to map questions.')
      return
    }
    const questions = Object.entries(mapped)
      .filter(([, on]) => on)
      .map(([id]) => ({
        questionId: Number(id),
        isRequired: required.has(Number(id)),
      }))
    return run(
      async () => {
        await repo.mapQuestionsToForm(mapFormId, questions)
      },
      'Form questions mapped.',
    )
  }

  const sendForm = () => {
    if (mapFormId == null) {
      showToast('Select a form to send.')
      return
    }
    return run(async () => {
      await repo.sendForm(mapFormId)
    }, 'Form notifications sent.')
  }

  const verifyStudent = (id: number) =>
    run(async () => {
      await repo.verifyStudent(id)
    }, 'Student verified.')

  const doExportCompany = () => {
    if (exportCompanyId == null) return
    const id = exportCompanyId
    const fields = [...exportFields]
    void run(async () => {
      const bytes = await repo.exportCompany(id, fields)
      downloadBlob(bytes, `company-${id}.xlsx`)
    })
    setExportCompanyId(null)
  }

  const openResponses = async (formId: number, title: string) => {
    try {
      const rows = await repo.getFormResponses(formId)
      setResponsesModal({ formId, title, rows })
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    }
  }

  const exportFormExcel = async (formId: number) => {
    try {
      const bytes = await repo.exportFormResponses(formId)
      downloadBlob(bytes, `form-${formId}-responses.xlsx`)
      showToast('Download started.')
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

  if (err || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">{err ?? 'Failed to load admin data.'}</p>
        <Button onClick={() => void load()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Export Fields Dialog */}
      <Dialog open={exportCompanyId != null} onOpenChange={() => setExportCompanyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Columns to Export</DialogTitle>
            <DialogDescription>
              Name, College Email, CGPA, Resume URL, and form questions are always included.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {EXPORT_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`exp-${f.key}`}
                  checked={exportFields.has(f.key)}
                  onChange={(e) => {
                    setExportFields((prev) => {
                      const n = new Set(prev)
                      if (e.target.checked) n.add(f.key)
                      else n.delete(f.key)
                      return n
                    })
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5"
                />
                <Label htmlFor={`exp-${f.key}`}>{f.label}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportCompanyId(null)}>Cancel</Button>
            <Button onClick={doExportCompany}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Responses Modal */}
      <Dialog open={responsesModal != null} onOpenChange={() => setResponsesModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{responsesModal?.title}</DialogTitle>
          </DialogHeader>
          {responsesModal?.rows.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No responses yet.</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-800">
                    <tr>
                      <th className="text-left p-2 border border-white/10">Name</th>
                      <th className="text-left p-2 border border-white/10">USN</th>
                      <th className="text-left p-2 border border-white/10">Email</th>
                      {responsesModal?.rows[0].answers.map((a) => (
                        <th key={a.id} className="text-left p-2 border border-white/10">{a.questionText}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responsesModal?.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 border border-white/10">{r.studentName}</td>
                        <td className="p-2 border border-white/10">{r.usn}</td>
                        <td className="p-2 border border-white/10">{r.collegeEmailId}</td>
                        {r.answers.map((a) => (
                          <td key={a.id} className="p-2 border border-white/10">{a.answer ?? '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponsesModal(null)}>Close</Button>
            {responsesModal && responsesModal.rows.length > 0 && (
              <Button onClick={() => void exportFormExcel(responsesModal.formId)} className="gap-2">
                <Download className="w-4 h-4" />
                Download Excel
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Company */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Create Company
          </CardTitle>
          <CardDescription className="text-white/60">
            Use ISO dates like 2026-06-12 to stay aligned with the backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input placeholder="Company name" value={cName} onChange={(e) => setCName(e.target.value)} />
            <Input placeholder="Min CGPA" type="number" value={cCgpa} onChange={(e) => setCCgpa(e.target.value)} />
            <Input placeholder="Package" value={cPkg} onChange={(e) => setCPkg(e.target.value)} />
            <Input placeholder="Stipend" value={cStip} onChange={(e) => setCStip(e.target.value)} />
            <Input placeholder="Test date (YYYY-MM-DD)" value={cTest} onChange={(e) => setCTest(e.target.value)} />
            <Input placeholder="Interview date (YYYY-MM-DD)" value={cInt} onChange={(e) => setCInt(e.target.value)} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => void createCompany()} disabled={busy} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Company
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question Bank */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-primary" />
            Question Bank
          </CardTitle>
          <CardDescription className="text-white/60">
            Dropdown options are stored without changing the schema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input 
              placeholder="Question text" 
              value={qText} 
              onChange={(e) => setQText(e.target.value)}
              className="sm:col-span-1 lg:col-span-2"
            />
            <Select value={qType} onValueChange={(v) => setQType(v as typeof qType)}>
              <SelectTrigger>
                <SelectValue placeholder="Field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">text</SelectItem>
                <SelectItem value="number">number</SelectItem>
                <SelectItem value="boolean">boolean</SelectItem>
                <SelectItem value="dropdown">dropdown</SelectItem>
              </SelectContent>
            </Select>
            {qType === 'dropdown' && (
              <Input 
                placeholder="Options (comma separated)" 
                value={qOpts} 
                onChange={(e) => setQOpts(e.target.value)}
                className="sm:col-span-2 lg:col-span-3"
              />
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => void createQuestion()} disabled={busy} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Question
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create and Send Forms */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Create and Send Forms
          </CardTitle>
          <CardDescription className="text-white/60">
            Create a form, map reusable questions, then send a push notification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input placeholder="Form title" value={fTitle} onChange={(e) => setFTitle(e.target.value)} />
            <Select value={fType} onValueChange={(v) => setFType(v as typeof fType)}>
              <SelectTrigger>
                <SelectValue placeholder="Form type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consent">consent</SelectItem>
                <SelectItem value="tracker">tracker</SelectItem>
                <SelectItem value="custom">custom</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={fCompanyId != null ? String(fCompanyId) : ''} 
              onValueChange={(v) => setFCompanyId(v === '' ? null : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Linked company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Global</SelectItem>
                {data.companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => void createForm()} disabled={busy} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Form
            </Button>
          </div>

          <Separator className="bg-white/10" />

          <div>
            <h4 className="text-sm font-medium mb-4">Map Questions to Form</h4>
            <div className="mb-4">
            <Select 
              value={mapFormId != null ? String(mapFormId) : ''} 
              onValueChange={(v) => setMapFormId(v === '' ? null : Number(v))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a form" />
              </SelectTrigger>
              <SelectContent>
                {data.forms.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.questions.map((q) => (
                <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={mapped[q.id] ?? false}
                      disabled={busy}
                      onChange={(e) =>
                        setMapped((m) => ({ ...m, [q.id]: e.target.checked }))
                      }
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{q.questionText}</p>
                      <p className="text-xs text-muted-foreground">{q.fieldType}</p>
                      {mapped[q.id] && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            disabled={busy || !mapped[q.id]}
                            checked={required.has(q.id)}
                            onChange={(e) => {
                              setRequired((prev) => {
                                const n = new Set(prev)
                                if (e.target.checked) n.add(q.id)
                                else n.delete(q.id)
                                return n
                              })
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-white/5"
                          />
                          <span className="text-sm text-muted-foreground">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => void saveMapping()} disabled={busy} className="gap-2">
                Save Mapping
              </Button>
              <Button variant="outline" onClick={() => void sendForm()} disabled={busy} className="gap-2">
                <Send className="w-4 h-4" />
                Send Notification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Students
          </CardTitle>
          <CardDescription className="text-white/60">
            Verify profiles to lock student edits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.students.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="font-semibold text-white">{s.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.collegeEmailId}</p>
                <Button
                  variant={s.verified ? 'secondary' : 'default'}
                  size="sm"
                  className="mt-3"
                  disabled={s.verified || busy}
                  onClick={() => void verifyStudent(s.id)}
                >
                  {s.verified ? (
                    <><CheckCircle className="w-4 h-4 mr-1" /> Verified</>
                  ) : (
                    'Verify'
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exports and Responses */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exports and Responses
          </CardTitle>
          <CardDescription className="text-white/60">
            Use the backend export endpoint and inspect responses per form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-3">Companies</h4>
            <div className="flex flex-wrap gap-2">
              {data.companies.map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setExportFields(new Set(EXPORT_FIELDS.map((f) => f.key)))
                    setExportCompanyId(c.id)
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  {c.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3">Forms</h4>
            <div className="flex flex-wrap gap-2">
              {data.forms.map((f) => (
                <Button
                  key={f.id}
                  variant="outline"
                  size="sm"
                  onClick={() => void openResponses(f.id, f.title)}
                >
                  {f.title}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}