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

/**
 * Build query string from filters object
 * Note: URLSearchParams always converts values to strings, which is normal.
 * Backend validator with z.coerce.number() should parse them correctly.
 */
function buildQueryString(filters = {}) {
  const params = new URLSearchParams()
  
  // Pagination - convert to number first, then to string for URLSearchParams
  // This ensures we send valid numeric strings that backend can parse
  if (filters.page !== undefined && filters.page !== null) {
    const pageNum = parseInt(String(filters.page), 10)
    if (!isNaN(pageNum) && pageNum > 0) {
      params.append('page', String(pageNum))
    }
  }
  if (filters.limit !== undefined && filters.limit !== null) {
    const limitNum = parseInt(String(filters.limit), 10)
    if (!isNaN(limitNum) && limitNum > 0) {
      params.append('limit', String(limitNum))
    }
  }
  
  // Search
  if (filters.search) params.append('search', filters.search)
  if (filters.skill_names) params.append('skill_names', filters.skill_names)
  if (filters.location_name) params.append('location_name', filters.location_name)
  
  // Filters
  if (filters.company_id) params.append('company_id', filters.company_id)
  if (filters.location_id) params.append('location_id', filters.location_id)
  if (filters.job_type) params.append('job_type', filters.job_type)
  if (filters.experience_level !== undefined && filters.experience_level !== null) {
    const expNum = parseInt(String(filters.experience_level), 10)
    if (!isNaN(expNum)) {
      params.append('experience_level', String(expNum))
    }
  }
  if (filters.status) params.append('status', filters.status)
  
  // Salary range
  if (filters.salary_min !== undefined && filters.salary_min !== null && filters.salary_min !== '') {
    const minNum = parseInt(String(filters.salary_min), 10)
    if (!isNaN(minNum)) {
      params.append('salary_min', String(minNum))
    }
  }
  if (filters.salary_max !== undefined && filters.salary_max !== null && filters.salary_max !== '') {
    const maxNum = parseInt(String(filters.salary_max), 10)
    if (!isNaN(maxNum)) {
      params.append('salary_max', String(maxNum))
    }
  }
  
  // Sorting
  if (filters.sort_by) params.append('sort_by', filters.sort_by)
  if (filters.sort_order) params.append('sort_order', filters.sort_order)
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const JobService = {
  /**
   * List jobs with filters
   * @param {Object} filters - Filter object with pagination, search, and filter params
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  list: (filters) => {
    const query = buildQueryString(filters)
    // Debug: log the final URL to see what's being sent
    if (process.env.NODE_ENV === 'development') {
      console.log('JobService.list - Filters object:', filters)
      console.log('JobService.list - Query string:', query)
      console.log('JobService.list - Full URL:', `/api/jobs${query}`)
    }
    return api.get(`/api/jobs${query}`)
  },
  /**
   * Get featured jobs (public)
   * @returns {Promise<{data: Array}>}
   */
  featured: () => api.get('/api/jobs/featured'),
  /**
   * Get latest jobs (public)
   * @returns {Promise<{data: Array}>}
   */
  latest: () => api.get('/api/jobs/latest'),
  /**
   * Get job detail (public)
   * @param {string} id - Job ID
   * @returns {Promise<{data: Object}>}
   */
  detail: (id) => api.get(`/api/jobs/${id}/public`),
  /**
   * Track job view
   * @param {string} id - Job ID
   * @returns {Promise<void>}
   */
  trackView: (id) => api.post(`/api/jobs/${id}/view`),
  /**
   * Create a new job (Recruiter only)
   * @param {Object} data - Job data according to CreateJobRequest schema
   * @returns {Promise<{message: string, data: Object}>}
   */
  create: (data) => api.post('/api/jobs', data),
  /**
   * List my jobs (Recruiter)
   * @param {Object} filters - Filter object with pagination and status
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  myJobs: (filters) => {
    const query = buildQueryString(filters)
    return api.get(`/api/jobs/my-jobs${query}`)
  },
  /**
   * Get job detail for management (Recruiter)
   * @param {string} id - Job ID
   * @returns {Promise<{data: Object}>}
   */
  getManage: (id) => api.get(`/api/jobs/${id}/manage`),
  /**
   * Get job statistics (Recruiter)
   * @param {string} id - Job ID
   * @returns {Promise<{data: Object}>}
   */
  getStats: (id) => api.get(`/api/jobs/${id}/stats`),
  /**
   * Update job (Recruiter)
   * @param {string} id - Job ID
   * @param {Object} data - Job data according to UpdateJobRequest schema
   * @returns {Promise<{message: string, data: Object}>}
   */
  update: (id, data) => api.put(`/api/jobs/${id}`, data),
  /**
   * Delete job (Recruiter)
   * @param {string} id - Job ID
   * @returns {Promise<{message: string}>}
   */
  delete: (id) => api.del(`/api/jobs/${id}`),
  /**
   * Update job status (Recruiter)
   * @param {string} id - Job ID
   * @param {string} status - Status: 'approved' or 'closed'
   * @returns {Promise<{message: string}>}
   */
  updateStatus: (id, status) => api.patch(`/api/jobs/${id}/status`, { status })
}

export const CompanyService = {
  /**
   * List public companies with query string (already includes ?page=...&limit=...)
   */
  list: (query) => api.get(`/api/companies${query || ''}`),
  /**
   * Get public company detail with full info
   */
  detail: (id) => api.get(`/api/companies/${id}?details=true`)
}

/**
 * Build query string for saved jobs filters
 */
function buildSavedJobsQueryString(filters = {}) {
  const params = new URLSearchParams()
  
  // Pagination
  if (filters.page !== undefined && filters.page !== null) {
    const pageNum = parseInt(String(filters.page), 10)
    if (!isNaN(pageNum) && pageNum > 0) {
      params.append('page', String(pageNum))
    }
  }
  if (filters.limit !== undefined && filters.limit !== null) {
    const limitNum = parseInt(String(filters.limit), 10)
    if (!isNaN(limitNum) && limitNum > 0) {
      params.append('limit', String(limitNum))
    }
  }
  
  // Search
  if (filters.search) params.append('search', filters.search)
  
  // Filters
  if (filters.job_type) params.append('job_type', filters.job_type)
  if (filters.location_id) params.append('location_id', filters.location_id)
  
  // Sorting
  if (filters.sort_by) params.append('sort_by', filters.sort_by)
  if (filters.order) params.append('order', filters.order)
  
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const SkillService = {
  /**
   * Search skills
   * @param {Object} params - Search parameters (search, category, limit, offset)
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  search: (params) => {
    const query = buildQueryString(params)
    return api.get(`/api/skills${query}`)
  },
  /**
   * Get skill categories
   * @returns {Promise<Array<string>>}
   */
  getCategories: () => api.get('/api/skills/categories')
}

export const LocationService = {
  /**
   * Search locations
   * @param {Object} params - Search parameters (search, type, parent_id, limit, offset)
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  list: (params) => {
    const query = buildQueryString(params)
    return api.get(`/api/locations${query}`)
  },
  /**
   * Get location by ID
   * @param {string} id - Location ID
   * @returns {Promise<{data: Object}>}
   */
  getById: (id) => api.get(`/api/locations/${id}`),
  /**
   * Get child locations by parent ID
   * @param {string} id - Parent location ID
   * @returns {Promise<{data: Array}>}
   */
  getChildren: (id) => api.get(`/api/locations/${id}/children`)
}

export const TagService = {
  /**
   * Search tags
   * @param {Object} params - Search parameters (search, limit, offset)
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  list: (params) => {
    const query = buildQueryString(params)
    return api.get(`/api/tags${query}`)
  },
  /**
   * Get tag by ID
   * @param {string} id - Tag ID
   * @returns {Promise<{data: Object}>}
   */
  getById: (id) => api.get(`/api/tags/${id}`)
}

export const SavedJobsService = {
  /**
   * Save a job
   * @param {string} jobId - Job ID to save
   * @returns {Promise<{message: string, data: Object}>}
   */
  save: (jobId) => api.post('/api/saved-jobs', { job_id: jobId }),
  
  /**
   * List saved jobs with filters
   * @param {Object} filters - Filter object with pagination, search, and filter params
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  list: (filters) => {
    const query = buildSavedJobsQueryString(filters)
    return api.get(`/api/saved-jobs${query}`)
  },
  
  /**
   * Unsave a job
   * @param {string} jobId - Job ID to unsave
   * @returns {Promise<{message: string}>}
   */
  unsave: (jobId) => api.del(`/api/saved-jobs/${jobId}`),
  
  /**
   * Check if a job is saved
   * @param {string} jobId - Job ID to check
   * @returns {Promise<{data: {saved: boolean}}>}
   */
  check: (jobId) => api.get(`/api/saved-jobs/check/${jobId}`)
}

// ============================================
// APPLICATION SERVICES
// ============================================

export const ApplicationService = {
  /**
   * Create application (Candidate)
   */
  create: (data) => api.post('/api/applications', data),

  /**
   * List my applications (Candidate)
   */
  listMine: (filters = {}) => {
    const params = new URLSearchParams()
    params.append('page', String(filters.page || 1))
    params.append('limit', String(filters.limit || 20))
    if (filters.status) params.append('status', filters.status)
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.order) params.append('order', filters.order)
    const query = params.toString()
    return api.get(`/api/applications${query ? `?${query}` : ''}`)
  },

  /**
   * Withdraw my application (Candidate)
   */
  withdraw: (id) => api.del(`/api/applications/${id}`),

  /**
   * Upload application document (Candidate)
   */
  uploadDocument: (id, file, documentType) => {
    const formData = new FormData()
    formData.append('file', file)
    if (documentType) formData.append('document_type', documentType)
    return api.post(`/api/applications/${id}/documents`, formData)
  },

  /**
   * List applications for a job (Recruiter)
   * @param {string} jobId - Job ID
   * @param {Object} filters - Filter object with pagination, status, stage, sort_by, order
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  listByJob: (jobId, filters = {}) => {
    const params = new URLSearchParams()
    params.append('page', String(filters.page || 1))
    params.append('limit', String(filters.limit || 20))
    if (filters.status && typeof filters.status === 'string' && filters.status.trim()) {
      params.append('status', filters.status)
    }
    if (filters.stage && typeof filters.stage === 'string' && filters.stage.trim()) {
      params.append('stage', filters.stage)
    }
    params.append('sort_by', filters.sort_by || 'applied_at')
    params.append('order', filters.order || 'desc')
    const query = params.toString()
    return api.get(`/api/applications/job/${jobId}?${query}`)
  },

  /**
   * Get job application statistics (Recruiter)
   */
  getStats: (jobId) => api.get(`/api/applications/job/${jobId}/stats`),

  /**
   * Get application detail
   */
  getDetail: (id) => api.get(`/api/applications/${id}`),

  /**
   * Get application CV (Recruiter)
   */
  getCV: (id) => api.get(`/api/applications/${id}/cv`),

  /**
   * Update application status (Recruiter)
   */
  updateStatus: (id, data) => api.patch(`/api/applications/${id}/status`, data),

  /**
   * Bulk update applications (Recruiter)
   */
  bulkUpdate: (data) => api.post('/api/applications/bulk-update', data),

  /**
   * Get application stages
   */
  getStages: (id) => api.get(`/api/applications/${id}/stages`),

  /**
   * Create application stage (Recruiter)
   */
  createStage: (id, data) => api.post(`/api/applications/${id}/stage`, data),

  /**
   * Update application stage (Recruiter)
   */
  updateStage: (id, data) => api.patch(`/api/applications/${id}/stage`, data),

  /**
   * Add application note (Recruiter)
   */
  addNote: (id, note) => api.post(`/api/applications/${id}/notes`, { note }),

  /**
   * Contact candidate (Recruiter)
   */
  contact: (id, data) => api.post(`/api/applications/${id}/contact`, data),

  /**
   * Get application documents
   */
  getDocuments: (id) => api.get(`/api/applications/${id}/documents`)
}

// ============================================
// USER SERVICE
// ============================================

export const UserService = {
  getPublicProfile: (profileId) => api.get(`/api/user/profiles/${profileId}/public`)
}
