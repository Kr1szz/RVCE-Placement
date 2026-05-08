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
import { downloadBlob, formatDate } from '../lib/format'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Company Form
  const [cName, setCName] = useState('')
  const [cCgpa, setCCgpa] = useState('')
  const [cPkg, setCPkg] = useState('')
  const [cStip, setCStip] = useState('')
  const [cTest, setCTest] = useState('')
  const [cInt, setCInt] = useState('')

  // Question Form
  const [qText, setQText] = useState('')
  const [qType, setQType] = useState<'text' | 'number' | 'boolean' | 'dropdown'>('text')
  const [qOpts, setQOpts] = useState('')

  // Form Creation
  const [fTitle, setFTitle] = useState('')
  const [fType, setFType] = useState<'consent' | 'tracker' | 'custom'>('custom')
  const [fCompanyId, setFCompanyId] = useState<string>('global')

  // Mapping Form
  const [mapFormId, setMapFormId] = useState<string>('')
  const [mapped, setMapped] = useState<Record<number, boolean>>({})
  const [required, setRequired] = useState<Set<number>>(() => new Set())

  // Export
  const [exportCompanyId, setExportCompanyId] = useState<number | null>(null)
  const [exportFields, setExportFields] = useState<Set<string>>(() => new Set(EXPORT_FIELDS.map((f) => f.key)))

  // Responses Modal
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
    const mq = window.matchMedia('(min-width: 1024px)')
    const fn = () => {}
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (task: () => Promise<void>, ok?: string) => {
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
      setCName(''); setCCgpa(''); setCPkg(''); setCStip(''); setCTest(''); setCInt('')
    }, 'Company created.')

  const createQuestion = () =>
    run(async () => {
      const options = qOpts.split(',').map(s => s.trim()).filter(Boolean)
      await repo.createQuestion({
        questionText: qText.trim(),
        fieldType: qType,
        options: qType === 'dropdown' ? options : undefined,
      })
      setQText(''); setQOpts('')
    }, 'Question created.')

  const createForm = () =>
    run(async () => {
      await repo.createForm({
        title: fTitle.trim(),
        type: fType,
        companyId: fCompanyId === 'global' ? null : Number(fCompanyId),
      })
      setFTitle('')
    }, 'Form created.')

  const saveMapping = () => {
    if (!mapFormId) return showToast('Select a form.')
    const questions = Object.entries(mapped)
      .filter(([, on]) => on)
      .map(([id]) => ({
        questionId: Number(id),
        isRequired: required.has(Number(id)),
      }))
    return run(async () => {
      await repo.mapQuestionsToForm(Number(mapFormId), questions)
    }, 'Form questions mapped.')
  }

  const sendForm = () => {
    if (!mapFormId) return showToast('Select a form.')
    return run(async () => {
      await repo.sendForm(Number(mapFormId))
    }, 'Notifications sent.')
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
      downloadBlob(new Blob([bytes] as any), `company-${id}.xlsx`)
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
      downloadBlob(new Blob([bytes] as any), `form-${formId}-responses.xlsx`)
      showToast('Download started.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    }
  }

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-medium">Loading SPC dashboard...</div>

  if (err || !data) return (
    <Card className="border-destructive/20 bg-destructive/5 text-center p-12">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">Admin Panel Error</h3>
      <p className="text-slate-500 mb-6">{err}</p>
      <Button onClick={load}>Reload Dashboard</Button>
    </Card>
  )

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="forms">Forms & Questions</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Active Drives</CardTitle>
                <div className="text-3xl font-bold">{data.companies.length}</div>
              </CardHeader>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Students</CardTitle>
                <div className="text-3xl font-bold">{data.students.length}</div>
              </CardHeader>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-wider">Forms Shared</CardTitle>
                <div className="text-3xl font-bold">{data.forms.length}</div>
              </CardHeader>
            </Card>
            <Card className="bg-indigo-500/5 border-indigo-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Question Bank</CardTitle>
                <div className="text-3xl font-bold">{data.questions.length}</div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Companies</CardTitle>
              <CardDescription>Latest placement opportunities added to the portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Min CGPA</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Test Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.companies.slice(0, 5).map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold">{c.name}</TableCell>
                      <TableCell>{c.minCgpa.toFixed(1)}</TableCell>
                      <TableCell>{c.package || 'TBD'}</TableCell>
                      <TableCell>{c.testDate ? formatDate(c.testDate) : 'TBD'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setExportCompanyId(c.id)}>
                          <Download className="w-4 h-4 mr-1" /> Export
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Create Drive
              </CardTitle>
              <CardDescription>Add a new company recruitment drive details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input placeholder="e.g. Google" value={cName} onChange={e => setCName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Min CGPA</Label>
                  <Input type="number" step="0.1" placeholder="e.g. 7.5" value={cCgpa} onChange={e => setCCgpa(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Package</Label>
                  <Input placeholder="e.g. 25 LPA" value={cPkg} onChange={e => setCPkg(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Stipend</Label>
                  <Input placeholder="e.g. 50k / month" value={cStip} onChange={e => setCStip(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Test Date (ISO)</Label>
                  <Input placeholder="2026-06-15" value={cTest} onChange={e => setCTest(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Interview Date (ISO)</Label>
                  <Input placeholder="2026-06-20" value={cInt} onChange={e => setCInt(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end bg-slate-50/50 p-6 border-t">
              <Button onClick={createCompany} disabled={busy || !cName}>Add Company</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Drives</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Stipend</TableHead>
                    <TableHead>Min CGPA</TableHead>
                    <TableHead className="text-right">Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.companies.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold text-primary">{c.name}</TableCell>
                      <TableCell>{c.package || 'TBD'}</TableCell>
                      <TableCell>{c.stipend || 'TBD'}</TableCell>
                      <TableCell>{c.minCgpa}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setExportCompanyId(c.id)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Add Question
                </CardTitle>
                <CardDescription>Create reusable fields for your forms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Label</Label>
                  <Input placeholder="e.g. Current Location" value={qText} onChange={e => setQText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={qType} onValueChange={(v: any) => setQType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Yes / No</SelectItem>
                      <SelectItem value="dropdown">Dropdown Options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {qType === 'dropdown' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label>Options (comma separated)</Label>
                    <Input placeholder="Bangalore, Pune, Hyderabad" value={qOpts} onChange={e => setQOpts(e.target.value)} />
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end border-t p-6">
                <Button onClick={createQuestion} disabled={busy || !qText}>Create Question</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Create Form
                </CardTitle>
                <CardDescription>Group questions into a fillable form.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Form Title</Label>
                  <Input placeholder="e.g. Pre-Placement Survey" value={fTitle} onChange={e => setFTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Form Type</Label>
                    <Select value={fType} onValueChange={(v: any) => setFType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consent">Consent</SelectItem>
                        <SelectItem value="tracker">Tracker</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Link to Drive</Label>
                    <Select value={fCompanyId} onValueChange={setFCompanyId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global (All Students)</SelectItem>
                        {data.companies.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t p-6">
                <Button onClick={createForm} disabled={busy || !fTitle}>Create Form</Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Map Questions & Publish</CardTitle>
                <CardDescription>Select questions for a form and notify students.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveMapping} disabled={busy || !mapFormId}>Save Mapping</Button>
                <Button onClick={sendForm} disabled={busy || !mapFormId} className="gap-2">
                  <Send className="w-4 h-4" /> Notify
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="max-w-md">
                <Label className="mb-2 block">Active Form</Label>
                <Select value={mapFormId} onValueChange={setMapFormId}>
                  <SelectTrigger className="w-full font-bold">
                    <SelectValue placeholder="Select a form to configure" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.forms.map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.questions.map(q => (
                  <div key={q.id} className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    mapped[q.id] ? "border-primary/40 bg-primary/5 shadow-sm" : "border-slate-100 bg-white dark:bg-slate-900 opacity-60"
                  )}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <p className="font-bold leading-none">{q.questionText}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{q.fieldType}</p>
                      </div>
                      <Checkbox 
                        checked={mapped[q.id] || false} 
                        onCheckedChange={v => setMapped(m => ({...m, [q.id]: !!v}))} 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={`req-${q.id}`}
                        disabled={!mapped[q.id]}
                        checked={required.has(q.id)}
                        onCheckedChange={v => setRequired(prev => {
                          const n = new Set(prev);
                          if(v) n.add(q.id); else n.delete(q.id);
                          return n;
                        })}
                      />
                      <Label htmlFor={`req-${q.id}`} className={cn("text-xs", !mapped[q.id] && "text-slate-400")}>Required field</Label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>View Submissions</CardTitle>
              <CardDescription>Monitor student participation and download data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.forms.map(f => (
                  <Button 
                    key={f.id} 
                    variant="outline" 
                    className="justify-between h-auto py-3 px-4"
                    onClick={() => void openResponses(f.id, f.title)}
                  >
                    <div className="text-left overflow-hidden">
                      <p className="font-bold truncate">{f.title}</p>
                      <p className="text-[10px] text-slate-500">{f.responseCount || 0} responses</p>
                    </div>
                    <Eye className="w-4 h-4 text-primary opacity-50" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Verification</CardTitle>
              <CardDescription>Verify profiles to prevent further edits before sharing data with companies.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.students.map(s => (
                  <Card key={s.id} className="bg-slate-50 dark:bg-slate-800/40 border-none">
                    <CardContent className="p-4 flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{s.name}</p>
                          <p className="text-xs text-slate-500 truncate">{s.collegeEmailId}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={s.verified ? "ghost" : "default"}
                        className={cn("w-full", s.verified && "text-green-500 bg-green-500/10")}
                        disabled={s.verified || busy}
                        onClick={() => void verifyStudent(s.id)}
                      >
                        {s.verified ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Verified</> : "Verify Profile"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {exportCompanyId != null && (
        <Dialog open={true} onOpenChange={() => setExportCompanyId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configure Export</DialogTitle>
              <DialogDescription>
                Select optional columns to include in the Excel sheet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {EXPORT_FIELDS.map(f => (
                <div key={f.key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`field-${f.key}`} 
                    checked={exportFields.has(f.key)}
                    onCheckedChange={v => setExportFields(prev => {
                      const n = new Set(prev);
                      if(v) n.add(f.key); else n.delete(f.key);
                      return n;
                    })}
                  />
                  <Label htmlFor={`field-${f.key}`} className="text-sm cursor-pointer">{f.label}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setExportCompanyId(null)}>Cancel</Button>
              <Button onClick={doExportCompany} className="gap-2">
                <Download className="w-4 h-4" /> Start Export
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {responsesModal && (
        <Dialog open={true} onOpenChange={() => setResponsesModal(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl">{responsesModal.title}</DialogTitle>
              <DialogDescription>Viewing raw student submissions for this form.</DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-6 pt-2">
              {responsesModal.rows.length === 0 ? (
                <div className="py-20 text-center text-slate-400">No responses recorded yet.</div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="font-bold whitespace-nowrap">Name</TableHead>
                        <TableHead className="font-bold whitespace-nowrap">USN</TableHead>
                        {responsesModal.rows[0].answers.map(a => (
                          <TableHead key={a.id} className="font-bold whitespace-nowrap">{a.questionText}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responsesModal.rows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium whitespace-nowrap">{r.studentName}</TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{r.usn}</TableCell>
                          {r.answers.map(a => (
                            <TableCell key={a.id} className="text-slate-600 dark:text-slate-400 whitespace-nowrap">{a.answer ?? '—'}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t">
              <Button variant="ghost" onClick={() => setResponsesModal(null)}>Close</Button>
              {responsesModal.rows.length > 0 && (
                <Button onClick={() => void exportFormExcel(responsesModal.formId)} className="gap-2">
                  <Download className="w-4 h-4" /> Download Excel
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
