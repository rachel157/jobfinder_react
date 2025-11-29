import React, { useCallback, useEffect, useMemo, useState } from 'react'
import CompanyFilters from './CompanyFilters.jsx'
import CompanyList from './CompanyList.jsx'
import { CompanyService } from '../lib/api.js'
import './Companies.css'

const DEFAULT_LIMIT = 12

const sizeOptions = [
  { value: '', label: 'Tất cả quy mô' },
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' }
]

const companyTypeOptions = [
  { value: '', label: 'Tất cả loại hình' },
  { value: 'Product', label: 'Product' },
  { value: 'Outsourcing', label: 'Outsourcing' },
  { value: 'Agency', label: 'Agency' },
  { value: 'Hybrid', label: 'Hybrid' }
]

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'open_jobs', label: 'Nhiều tin tuyển dụng' },
  { value: 'name_az', label: 'Tên A-Z' }
]

const SAMPLE_COMPANIES = [
  {
    id: 'sample-1',
    name: 'ACME Software',
    description: 'Công ty sản phẩm SaaS phục vụ khách hàng toàn cầu.',
    logo_url: '',
    size: 180,
    contact_address: 'Hà Nội, Việt Nam',
    is_verified: true,
    company_details: {
      industry: 'Software',
      founded_year: 2015,
      employee_count_min: 100,
      employee_count_max: 250,
      website_url: 'https://example.com',
      company_type: 'Product',
      revenue_range: '1M-5M USD',
      culture_description: 'Môi trường mở và tập trung học hỏi.',
      headquarters_location: { id: 'loc-hn', name: 'Hà Nội, Việt Nam' }
    },
    stats: { open_jobs_count: 12 }
  },
  {
    id: 'sample-2',
    name: 'Bright Labs',
    description: 'Studio thiết kế và phát triển sản phẩm số.',
    logo_url: '',
    size: 80,
    contact_address: 'TP. Hồ Chí Minh, Việt Nam',
    is_verified: false,
    company_details: {
      industry: 'Design & Tech',
      employee_count_min: 50,
      employee_count_max: 100,
      website_url: 'https://brightlabs.vn',
      company_type: 'Agency',
      culture_description: 'Đề cao sáng tạo và hợp tác.',
      headquarters_location: { id: 'loc-hcm', name: 'TP. Hồ Chí Minh, Việt Nam' }
    },
    stats: { open_jobs_count: 5 }
  },
  {
    id: 'sample-3',
    name: 'CloudOps Asia',
    description: 'Cung cấp dịch vụ hạ tầng và tư vấn DevOps.',
    logo_url: '',
    size: 40,
    contact_address: 'Đà Nẵng, Việt Nam',
    is_verified: true,
    company_details: {
      industry: 'Cloud & DevOps',
      employee_count_min: 20,
      employee_count_max: 60,
      website_url: 'https://cloudops.asia',
      company_type: 'Outsourcing',
      culture_description: 'Chú trọng chia sẻ kiến thức và vận hành tinh gọn.',
      headquarters_location: { id: 'loc-dn', name: 'Đà Nẵng, Việt Nam' }
    },
    stats: { open_jobs_count: 3 }
  }
]

const buildQuery = (filters) => {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.industry) params.set('industry', filters.industry)
  if (filters.locationId) params.set('locationId', filters.locationId)
  if (filters.companyType) params.set('companyType', filters.companyType)
  if (filters.sizeRange) params.set('sizeRange', filters.sizeRange)
  if (filters.hasOpenJobs) params.set('hasOpenJobs', 'true')
  params.set('page', String(filters.page || 1))
  params.set('limit', String(filters.limit || DEFAULT_LIMIT))
  return params.toString()
}

const applyClientSort = (items, sortKey) => {
  if (!Array.isArray(items)) return []
  const list = [...items]
  switch (sortKey) {
    case 'oldest':
      return list.sort(
        (a, b) =>
          new Date(a.created_at || a.posted_at || a.verification_date || 0) -
          new Date(b.created_at || b.posted_at || b.verification_date || 0)
      )
    case 'open_jobs':
      return list.sort((a, b) => (b?.stats?.open_jobs_count || 0) - (a?.stats?.open_jobs_count || 0))
    case 'name_az':
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    case 'newest':
    default:
      return list.sort(
        (a, b) =>
          new Date(b.created_at || b.posted_at || b.verification_date || 0) -
          new Date(a.created_at || a.posted_at || a.verification_date || 0)
      )
  }
}

const normalizeCompany = (raw) => {
  if (!raw) return null
  const details = raw.company_details || {}
  const location = details.headquarters_location || (raw.contact_address ? { name: raw.contact_address } : null)
  const sizeMin = details.employee_count_min
  const sizeMax = details.employee_count_max
  const computedSize = sizeMin && sizeMax ? `${sizeMin}-${sizeMax}` : raw.size ? `${raw.size}` : null
  return {
    ...raw,
    company_details: details,
    location,
    display_size: computedSize,
    description_short: raw.description || details.culture_description || ''
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    locationId: '',
    companyType: '',
    sizeRange: '',
    hasOpenJobs: false,
    page: 1,
    limit: DEFAULT_LIMIT,
    sort: 'newest'
  })
  const [pagination, setPagination] = useState({ page: 1, limit: DEFAULT_LIMIT, total: 0 })
  const [industryOptions, setIndustryOptions] = useState([{ value: '', label: 'Tất cả ngành' }])
  const [locationOptions, setLocationOptions] = useState([{ value: '', label: 'Tất cả địa điểm' }])

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const query = buildQuery(filters)
      const payload = await CompanyService.list(query ? `?${query}` : '')
      const items = Array.isArray(payload?.data) ? payload.data.map(normalizeCompany).filter(Boolean) : Array.isArray(payload) ? payload.map(normalizeCompany).filter(Boolean) : []
      const sorted = applyClientSort(items, filters.sort)
      setCompanies(sorted)
      const pag = payload?.pagination || {}
      setPagination({
        page: pag.page || filters.page || 1,
        limit: pag.limit || filters.limit || DEFAULT_LIMIT,
        total: pag.total || items.length
      })

      const industries = new Set(items.map((c) => c?.company_details?.industry).filter(Boolean))
      setIndustryOptions([{ value: '', label: 'Tất cả ngành' }, ...Array.from(industries).map((i) => ({ value: i, label: i }))])
      const locations = new Set(items.map((c) => c?.location?.name).filter(Boolean))
      setLocationOptions([{ value: '', label: 'Tất cả địa điểm' }, ...Array.from(locations).map((loc) => ({ value: loc, label: loc }))])
    } catch (err) {
      const sample = SAMPLE_COMPANIES.map(normalizeCompany).filter(Boolean)
      setCompanies(sample)
      setPagination({ page: 1, limit: DEFAULT_LIMIT, total: sample.length })
      setIndustryOptions((prev) => (prev[0]?.label === 'Tất cả ngành' ? prev : [{ value: '', label: 'Tất cả ngành' }]))
      setLocationOptions((prev) => (prev[0]?.label === 'Tất cả địa điểm' ? prev : [{ value: '', label: 'Tất cả địa điểm' }]))
      setError(err?.message || 'Không tải được danh sách công ty (hiển thị dữ liệu mẫu)')
    } finally {
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [filters])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const handleFilterChange = (partial) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      page: 1
    }))
  }

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const handleClearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      search: '',
      industry: '',
      locationId: '',
      companyType: '',
      sizeRange: '',
      hasOpenJobs: false,
      page: 1
    }))
  }

  const totalFound = pagination.total || companies.length
  const sortedCompanies = useMemo(() => applyClientSort(companies, filters.sort), [companies, filters.sort])

  return (
    <div className="companies-page">
      <div className="companies-container">
        <div className="sidebar-column">
          <CompanyFilters
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
            sizeOptions={sizeOptions}
            industryOptions={industryOptions}
            locationOptions={locationOptions}
            companyTypeOptions={companyTypeOptions}
          />
        </div>
        <div className="list-column">
          <CompanyList
            items={sortedCompanies}
            loading={loading}
            error={error}
            onRetry={loadCompanies}
            total={totalFound}
            page={filters.page}
            limit={filters.limit}
            onPageChange={handlePageChange}
            sort={filters.sort}
            onSortChange={(sort) => handleFilterChange({ sort })}
            clearFilters={handleClearFilters}
            sortOptions={sortOptions}
          />
        </div>
      </div>
    </div>
  )
}
