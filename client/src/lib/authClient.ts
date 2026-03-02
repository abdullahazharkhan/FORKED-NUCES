// All auth calls go through Next.js API route proxies (server-side → EC2).
// This avoids browser mixed-content blocks (HTTPS Vercel → HTTP EC2).
// The proxy routes live in src/app/api/auth/*/route.ts and use DRF_API_BASE_URL.

export async function registerUser(payload: {
  full_name: string
  nu_email: string
  password: string
}) {
  let res: Response
  try {
    res = await fetch(`/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err: any) {
    throw { detail: 'Network error: failed to reach the API. ' + (err?.message || String(err)) }
  }

  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    data = { detail: text }
  }

  if (!res.ok) {
    throw { status: res.status, statusText: res.statusText, body: data }
  }

  return data
}

export async function verifyEmail(payload: { token: string; nu_email: string }) {
  let res: Response
  try {
    res = await fetch(`/api/auth/verify-email/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err: any) {
    throw { detail: 'Network error: failed to reach the API. ' + (err?.message || String(err)) }
  }

  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    data = { detail: text }
  }

  if (!res.ok) {
    throw { status: res.status, statusText: res.statusText, body: data }
  }

  return data
}

export async function resendVerificationEmail(payload: { nu_email: string }) {
  let res: Response
  try {
    res = await fetch(`/api/auth/resend-verification-email/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err: any) {
    throw { detail: 'Network error: failed to reach the API. ' + (err?.message || String(err)) }
  }

  const text = await res.text()
  let data: any
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    data = { detail: text }
  }

  if (!res.ok) {
    throw { status: res.status, statusText: res.statusText, body: data }
  }

  return data
}

export default {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
}
