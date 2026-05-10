import { useCallback, useEffect, useState } from 'react'
import type { AppUser } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Upload } from 'lucide-react'

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (err || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-400">{err ?? 'Failed to load profile.'}</p>
        <Button onClick={() => void load()}>Retry</Button>
      </div>
    )
  }

  const FormField = ({ label, value, onChange, id, type = 'text', disabled = false }: {
    label: string
    value: string
    onChange: (v: string) => void
    id: string
    type?: string
    disabled?: boolean
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Profile Status</CardTitle>
              <CardDescription className="text-white/60 mt-1">
                {user.verified
                  ? 'Your profile has been verified by SPC and is now read-only.'
                  : 'Complete the profile once and upload your latest resume before verification.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={user.verified ? 'success' : 'warning'} className="gap-1.5">
                {user.verified ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {user.verified ? 'Verified' : 'Awaiting verification'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={readOnly}
                onClick={uploadResume}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {user.resumeUrl == null ? 'Upload Resume' : 'Replace'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {user.resumeUrl != null && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Resume: <span className="text-white">{user.resumeUrl}</span>
            </p>
          </CardContent>
        )}
      </Card>

      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Academic Profile</CardTitle>
          <CardDescription className="text-white/60">
            This data powers eligibility checks and company exports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Name" value={name} onChange={setName} id="pf-name" disabled={readOnly} />
            <FormField label="USN" value={usn} onChange={setUsn} id="pf-usn" disabled={readOnly} />
            <FormField label="College Email" value={collegeEmail} onChange={setCollegeEmail} id="pf-ce" disabled={readOnly} />
            <FormField label="Personal Email" value={personalEmail} onChange={setPersonalEmail} id="pf-pe" disabled={readOnly} />
            <FormField label="Phone Number" value={phone} onChange={setPhone} id="pf-phone" disabled={readOnly} />
            <FormField label="Aadhar" value={aadhar} onChange={setAadhar} id="pf-aadhar" disabled={readOnly} />
            <FormField label="LinkedIn URL" value={linkedIn} onChange={setLinkedIn} id="pf-li" disabled={readOnly} />
            <FormField label="GitHub URL" value={gitHub} onChange={setGitHub} id="pf-gh" disabled={readOnly} />
            <FormField label="UG CGPA" value={cgpa} onChange={setCgpa} id="pf-cgpa" type="number" disabled={readOnly} />
            <FormField label="1st Sem SGPA" value={firstSem} onChange={setFirstSem} id="pf-fs" type="number" disabled={readOnly} />
            <FormField label="10th Marks" value={tenth} onChange={setTenth} id="pf-10" type="number" disabled={readOnly} />
            <FormField label="12th Marks" value={twelfth} onChange={setTwelfth} id="pf-12" type="number" disabled={readOnly} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              disabled={readOnly}
              onClick={() => void save()}
              className="gap-2"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}