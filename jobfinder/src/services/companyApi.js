import { api } from '../lib/api'

const pickData = (res) => res?.data ?? res

export const companyApi = {
  createCompany: (payload) => api.post('/api/companies', payload).then(pickData),
  getMyCompany: () => api.get('/api/companies/me').then(pickData),
  updateMyCompany: (payload) => api.patch('/api/companies/me', payload).then(pickData),

  getMyCompanyDetails: () => api.get('/api/companies/me/details').then(pickData),
  createMyCompanyDetails: (payload) => api.post('/api/companies/me/details', payload).then(pickData),
  updateMyCompanyDetails: (payload) => api.patch('/api/companies/me/details', payload).then(pickData),
  deleteMyCompanyDetails: () => api.del('/api/companies/me/details').then(pickData),

  listMyBenefits: () => api.get('/api/companies/me/benefits').then(pickData),
  createBenefit: (payload) => api.post('/api/companies/me/benefits', payload).then(pickData),
  updateBenefit: (id, payload) => api.patch(`/api/companies/me/benefits/${id}`, payload).then(pickData),
  deleteBenefit: (id) => api.del(`/api/companies/me/benefits/${id}`).then(pickData),

  uploadCompanyLogo: (companyId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/api/uploads/company-logo/${companyId}`, formData).then(pickData)
  },

  getPublicCompany: (id) => api.get(`/api/companies/${id}`).then(pickData),
}
