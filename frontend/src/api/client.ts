export class ApiClientError extends Error {
  status: number
  details: any

  constructor(message: string, status: number, details?: any) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.details = details
  }
}

async function readError(res: Response): Promise<Error> {
  try {
    const data = (await res.json()) as { message?: string; details?: any }
    if (data?.message) {
      let msg = data.message
      if (msg.trim().startsWith('[') && msg.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(msg)
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] && typeof parsed[0] === 'object') {
            const fieldLabels: Record<string, string> = {
              name: 'Full Name',
              usn: 'USN',
              collegeEmailId: 'College Email',
              personalEmailId: 'Personal Email',
              phoneNumber: 'Phone Number',
              aadhar: 'Aadhar Number',
              linkedIn: 'LinkedIn URL',
              gitHub: 'GitHub URL',
              ugCgpa: 'UG CGPA',
              tenthMarks: '10th Aggregate (%)',
              twelfthMarks: '12th Aggregate (%)',
              firstSemSgpa: '1st Sem SGPA',
              username: 'Username',
              password: 'Password',
              title: 'Title',
              type: 'Type',
              companyId: 'Company ID',
              questionText: 'Question Text',
              fieldType: 'Field Type',
              options: 'Options',
              minCgpa: 'Minimum CGPA',
              package: 'Package',
              stipend: 'Stipend',
              testDate: 'Test Date',
              interviewDate: 'Interview Date',
              deadline: 'Deadline',
              status: 'Status',
              reason: 'Reason',
              messageText: 'Message Text',
            }

            const formatted = parsed.map((err: any) => {
              const path = Array.isArray(err.path) ? err.path.join('.') : ''
              const label = fieldLabels[path] || path || 'Field'
              let errMessage = err.message || 'Invalid value'

              if (err.code === 'invalid_format' && err.format === 'email') {
                errMessage = 'Invalid email address'
              } else if (err.code === 'invalid_format' && err.format === 'regex' && err.pattern === '/^\\d+$/') {
                errMessage = 'Must contain only digits'
              } else if (err.code === 'too_small' && err.type === 'string') {
                errMessage = `Must be at least ${err.minimum} characters`
              } else if (err.code === 'too_big' && err.type === 'string') {
                errMessage = `Must be at most ${err.maximum} characters`
              } else if (err.message && err.message.startsWith('Invalid string: must match pattern')) {
                errMessage = 'Invalid format'
              }
              return `${label}: ${errMessage}`
            })
            msg = formatted.join('\n')
          }
        } catch {
          // ignore
        }
      }
      
      let details = data.details
      if (!details) {
        try {
          const parsed = JSON.parse(data.message || '')
          if (Array.isArray(parsed)) {
            details = parsed
          }
        } catch {
          // ignore
        }
      }

      return new ApiClientError(msg, res.status, details)
    }
  } catch {
    /* ignore */
  }
  return new ApiClientError(res.statusText || 'Request failed.', res.status)
}

export class ApiClient {
  private readonly baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  private authHeaders(): HeadersInit {
    const h: Record<string, string> = {}
    if (this.token) h.Authorization = `Bearer ${this.token}`
    return h
  }

  private getFullUrl(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`
    return `${this.baseUrl}${p}`
  }

  async getJson(path: string): Promise<Record<string, unknown>> {
    const res = await fetch(this.getFullUrl(path), {
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
    })
    if (!res.ok) throw await readError(res)
    return (await res.json()) as Record<string, unknown>
  }

  async getList(path: string): Promise<unknown[]> {
    const res = await fetch(this.getFullUrl(path), {
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
    })
    if (!res.ok) throw await readError(res)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }

  async postJson(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(this.getFullUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw await readError(res)
    return (await res.json()) as Record<string, unknown>
  }

  async putJson(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(this.getFullUrl(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw await readError(res)
    return (await res.json()) as Record<string, unknown>
  }

  async postFormData(
    path: string,
    form: FormData,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(this.getFullUrl(path), {
      method: 'POST',
      headers: this.authHeaders(),
      body: form,
    })
    if (!res.ok) throw await readError(res)
    return (await res.json()) as Record<string, unknown>
  }

  async getBytes(path: string): Promise<Uint8Array> {
    const res = await fetch(this.getFullUrl(path), {
      headers: this.authHeaders(),
    })
    if (!res.ok) throw await readError(res)
    const buf = await res.arrayBuffer()
    return new Uint8Array(buf)
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(this.getFullUrl(path), {
      method: 'DELETE',
      headers: this.authHeaders(),
    })
    if (!res.ok) throw await readError(res)
  }
}
