export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'

export async function registerUser(payload: {
  full_name: string
  nu_email: string
  password: string
}) {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/auth/register/`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err: any) {
    // Network error or CORS blocked the request
    throw { detail: 'Network error: failed to reach the API. ' + (err?.message || String(err)) }
  }

  const text = await res.text()
  // try to parse json, otherwise return text
  let data: any
  try {
    data = text ? JSON.parse(text) : null
  } catch (e) {
    data = { detail: text }
  }

  if (!res.ok) {
    // Throw a structured error so callers can inspect status and body
    const err = {
      status: res.status,
      statusText: res.statusText,
      body: data,
    }
    throw err
  }

  return data
}

export default {
  registerUser,
}
