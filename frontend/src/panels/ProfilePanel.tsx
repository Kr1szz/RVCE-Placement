import { useCallback, useEffect, useState } from 'react'
import type { AppUser } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, AlertCircle, Upload, Save, FileText } from 'lucide-react'

export function ProfilePanel() {
  const { repo } = useAuth()
  const { showToast } = useToast()
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [usn, setUsn] = useState('')
  const [collegeEmail, setCollegeEmail] = useState('')
  const [personalEmail, setPersonalEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [aadhar, setAadhar] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [gitHub, setGitHub] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [tenth, setTenth] = useState('')
  const [twelfth, setTwelfth] = useState('')
  const [firstSem, setFirstSem] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const u = await repo.getProfile()
      setUser(u)
      setName(u.name)
      setUsn(u.usn ?? '')
      setCollegeEmail(u.collegeEmailId)
      setPersonalEmail(u.personalEmailId)
      setPhone(u.phoneNumber ?? '')
      setAadhar(u.aadhar ?? '')
      setLinkedIn(u.linkedIn ?? '')
      setGitHub(u.gitHub ?? '')
      setCgpa(u.ugCgpa === 0 ? '' : String(u.ugCgpa))
      setTenth(u.tenthMarks === 0 ? '' : String(u.tenthMarks))
      setTwelfth(u.twelfthMarks === 0 ? '' : String(u.twelfthMarks))
      setFirstSem(u.firstSemSgpa === 0 ? '' : String(u.firstSemSgpa))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [repo])

  useEffect(() => {
    void load()
  }, [load])

  const readOnly = Boolean(user?.verified) || saving

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      await repo.updateProfile({
        name: name.trim(),
        usn: usn.trim(),
        collegeEmailId: collegeEmail.trim(),
        personalEmailId: personalEmail.trim(),
        phoneNumber: phone.trim(),
        aadhar: aadhar.trim(),
        linkedIn: linkedIn.trim(),
        gitHub: gitHub.trim(),
        ugCgpa: Number.parseFloat(cgpa) || user.ugCgpa,
        tenthMarks: Number.parseFloat(tenth) || user.tenthMarks,
        twelfthMarks: Number.parseFloat(twelfth) || user.twelfthMarks,
        firstSemSgpa: Number.parseFloat(firstSem) || user.firstSemSgpa,
      })
      showToast('Profile updated.')
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const uploadResume = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        await repo.uploadResume(file)
        showToast('Resume uploaded.')
        await load()
      } catch (e) {
        showToast(e instanceof Error ? e.message : String(e))
      }
    }
    input.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (err || !user) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load profile</h3>
          <p className="text-sm text-slate-500 mb-4">{err ?? 'An unknown error occurred.'}</p>
          <Button onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Verification & Resume Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Verification Status
                {user.verified ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    Awaiting Verification
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {user.verified
                  ? 'Your profile is locked and verified by SPC.'
                  : 'Complete your profile and upload a resume to get verified.'}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={uploadResume} 
              disabled={readOnly}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {user.resumeUrl ? 'Update Resume' : 'Upload Resume'}
            </Button>
          </div>
        </CardHeader>
        {user.resumeUrl && (
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="p-2 bg-white dark:bg-slate-900 rounded border shadow-sm">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Resume</p>
                <a 
                  href={user.resumeUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:underline truncate block"
                >
                  {user.resumeUrl.split('/').pop()}
                </a>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Academic & Personal Details</CardTitle>
          <CardDescription>
            Ensure all information matches your college records exactly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pf-name">Full Name</Label>
              <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-usn">USN</Label>
              <Input id="pf-usn" value={usn} onChange={(e) => setUsn(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-ce">College Email</Label>
              <Input id="pf-ce" type="email" value={collegeEmail} onChange={(e) => setCollegeEmail(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-pe">Personal Email</Label>
              <Input id="pf-pe" type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-phone">Phone Number</Label>
              <Input id="pf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-aadhar">Aadhar Number</Label>
              <Input id="pf-aadhar" value={aadhar} onChange={(e) => setAadhar(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-li">LinkedIn Profile URL</Label>
              <Input id="pf-li" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-gh">GitHub Profile URL</Label>
              <Input id="pf-gh" value={gitHub} onChange={(e) => setGitHub(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-cgpa">UG CGPA</Label>
              <Input id="pf-cgpa" type="number" step="0.01" value={cgpa} onChange={(e) => setCgpa(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-fs">1st Sem SGPA</Label>
              <Input id="pf-fs" type="number" step="0.01" value={firstSem} onChange={(e) => setFirstSem(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-10">10th Aggregate (%)</Label>
              <Input id="pf-10" type="number" step="0.1" value={tenth} onChange={(e) => setTenth(e.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-12">12th Aggregate (%)</Label>
              <Input id="pf-12" type="number" step="0.1" value={twelfth} onChange={(e) => setTwelfth(e.target.value)} disabled={readOnly} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t p-6 bg-slate-50/50 dark:bg-slate-900/50">
          <Button onClick={save} disabled={readOnly} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
