import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken, logout } from '../auth/auth'

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildUrl(path){
  const isAbs = /^https?:\/\//i.test(path)
  if(isAbs) return path
  if(path.startsWith('/api')) return `${BASE}${path}`
  return `${BASE}${path}`
}

let refreshPromise = null

async function refreshAccessToken(){
  const refreshToken = getRefreshToken()
  if(!refreshToken) return null
  if(refreshPromise) return refreshPromise
  refreshPromise = fetch(`${BASE}/api/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
    .then(async (res) => {
      const payload = await res.json().catch(() => ({}))
      if(!res.ok){
        const err = new Error(payload?.message || 'Khong the lam moi token')
        err.status = res.status
        throw err
      }
      const access = payload?.data?.access_token || payload?.access_token
      const newRefresh = payload?.data?.refresh_token || payload?.refresh_token
      if(access) setAuthToken(access)
      if(newRefresh) setRefreshToken(newRefresh)
      return access
    })
    .catch((err) => {
      logout()
      throw err
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

async function request(path, { method = 'GET', headers = {}, body, withCredentials = false } = {}){
  const url = buildUrl(path)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const makeFetch = async () => {
    const opts = {
      method,
      headers: isFormData ? { ...headers } : { 'Content-Type': 'application/json', ...headers },
      credentials: withCredentials ? 'include' : 'omit'
    }
    const token = getAuthToken()
    if(token){
      opts.headers = { ...opts.headers, Authorization: `Bearer ${token}` }
    }
    if(body !== undefined){
      if(isFormData){
        opts.body = body
      }else{
        opts.body = typeof body === 'string' ? body : JSON.stringify(body)
      }
    }
    return fetch(url, opts)
  }

  let response
  let retried = false
  const MAX_RETRIES = 1
  let retryCount = 0
  
  while(retryCount <= MAX_RETRIES){
    try {
      response = await makeFetch()
    } catch (e) {
      const err = new Error('Khong the ket noi may chu. Kiem tra backend/proxy/URL.')
      err.cause = e
      throw err
    }
    if(response.status === 401 && !retried && retryCount < MAX_RETRIES){
      try {
        await refreshAccessToken()
        retried = true
        retryCount++
        continue
      } catch (err) {
        throw err
      }
    }
    break
  }

  const ct = response.headers.get('content-type') || ''
  const data = ct.includes('application/json') ? await response.json() : await response.text()
  if(!response.ok){
    const err = new Error(data?.message || response.statusText || 'Request error')
    err.status = response.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  get: (p, o) => request(p, { ...o, method: 'GET' }),
  post: (p, b, o) => request(p, { ...o, method: 'POST', body: b }),
  put: (p, b, o) => request(p, { ...o, method: 'PUT', body: b }),
  patch: (p, b, o) => request(p, { ...o, method: 'PATCH', body: b }),
  del: (p, o) => request(p, { ...o, method: 'DELETE' })
}

export const JobService = {
  list: (query) => api.get(`/api/jobs${query ? `?${query}` : ''}`),
  detail: (id) => api.get(`/api/jobs/${id}`),
  create: (payload) => api.post('/api/jobs', payload)
}

export const CompanyService = {
  list: (query) => api.get(`/api/companies${query || ''}`),
  detail: (id) => api.get(`/api/companies/${id}`)
}
