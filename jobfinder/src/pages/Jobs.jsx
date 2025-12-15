import React, { useCallback, useEffect, useState, useRef } from 'react'
import JobCard from '../components/JobCard.jsx'
import JobsSidebarFilters from './JobsSidebarFilters.jsx'
import JobsList from './JobsList.jsx'
import { JobService } from '../lib/api.js'
import './JobsPage.css'
import './JobsStates.css'

const PAGE_SIZE = 20
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', sort_by: 'posted_at', sort_order: 'desc' },
  { value: 'oldest', label: 'Cũ nhất', sort_by: 'posted_at', sort_order: 'asc' },
  { value: 'salaryHigh', label: 'Lương cao nhất', sort_by: 'salary_min', sort_order: 'desc' },
  { value: 'salaryLow', label: 'Lương thấp nhất', sort_by: 'salary_min', sort_order: 'asc' }
]
const JOB_TYPES = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' }
]
const EXPERIENCE_LEVELS = [
  { value: 'any', label: 'Bất kỳ' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' }
]

const SAMPLE_JOBS = [
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    companyName: 'Luma Tech',
    companyLogoUrl: '',
    location: 'Hanoi, Vietnam',
    salaryMin: 1800,
    salaryMax: 2500,
    currency: 'USD',
    jobType: 'full_time',
    experienceLevel: 'mid',
    skills: ['React', 'TypeScript', 'CSS'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    descriptionShort: 'Build fast, delightful UI for our SaaS platform using React.'
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    companyName: 'OceanSoft',
    companyLogoUrl: '',
    location: 'Da Nang, Vietnam',
    salaryMin: 1700,
    salaryMax: 2600,
    currency: 'USD',
    jobType: 'full_time',
    experienceLevel: 'mid',
    skills: ['Node.js', 'Postgres', 'Docker'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    descriptionShort: 'Design and scale APIs and services on modern infrastructure.'
  },
  {
    id: 'product-designer',
    title: 'Product Designer',
    companyName: 'Nova Labs',
    companyLogoUrl: '',
    location: 'Ho Chi Minh City, Vietnam',
    salaryMin: 1500,
    salaryMax: 2200,
    currency: 'USD',
    jobType: 'part_time',
    experienceLevel: 'senior',
    skills: ['Figma', 'UX', 'Research'],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    descriptionShort: 'Lead product discovery and craft intuitive experiences.'
  }
]

/**
 * Map backend job data to frontend format
 */
export function mapJobData(backendJob) {
  return {
    id: backendJob.id,
    title: backendJob.title,
    // Hỗ trợ cả companies (số nhiều) và company (số ít) để tương thích với cả hai format
    companyName: backendJob.companies?.name || backendJob.company?.name || 'Chưa có tên công ty',
    companyLogoUrl: backendJob.companies?.logo_url || backendJob.company?.logo_url || '',
    location: backendJob.locations?.name || backendJob.location?.name || backendJob.location_text || 'Bất kỳ',
    salaryMin: backendJob.salary_range?.min,
    salaryMax: backendJob.salary_range?.max,
    currency: backendJob.salary_range?.currency || 'VND',
    jobType: backendJob.job_type,
    experienceLevel: backendJob.experience_level,
    skills: backendJob.job_skills?.map(js => js.skills?.name).filter(Boolean) || [],
    createdAt: backendJob.posted_at || backendJob.created_at,
    descriptionShort: backendJob.description?.substring(0, 150) || '',
    description: backendJob.description,
    posted_at: backendJob.posted_at,
    salary_range: backendJob.salary_range
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [locationFilter, setLocationFilter] = useState('')
  const [locationId, setLocationId] = useState('')
  const [selectedJobTypes, setSelectedJobTypes] = useState([])
  const [experienceLevel, setExperienceLevel] = useState('any')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [keyword])

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      // Map frontend sort options to backend params
      const sortOption = SORT_OPTIONS.find(opt => opt.value === sortOrder) || SORT_OPTIONS[0]
      
      // Map experience level from frontend format to backend format
      let experienceLevelValue = null
      if (experienceLevel !== 'any') {
        const experienceMap = { junior: 1, mid: 2, senior: 3 }
        experienceLevelValue = experienceMap[experienceLevel] || null
      }

      // Build search query - combine keyword and multiple job types
      // Note: Skills and location are handled separately via skill_names and location_name filters
      let searchQuery = debouncedKeyword.trim()
      
      // Prepare location name for filtering (separate from search query)
      const locationName = locationFilter.trim() && !locationId ? locationFilter.trim() : undefined
      
      // Prepare skill names for filtering (separate from search query)
      // Join skills with space - backend will search for jobs containing any of these skills
      const skillNames = skills.length > 0 ? skills.join(' ') : undefined
      
      // If multiple job types are selected, add them to search query
      // Otherwise, use job_type filter for single selection
      let jobTypeFilter = undefined
      if (selectedJobTypes.length === 1) {
        // Backend supports single job_type filter
        jobTypeFilter = selectedJobTypes[0]
      } else if (selectedJobTypes.length > 1) {
        // Multiple job types: add to search query
        const jobTypesText = selectedJobTypes
          .map(t => JOB_TYPES.find(opt => opt.value === t)?.label)
          .filter(Boolean)
          .join(' ')
        searchQuery = [searchQuery, jobTypesText].filter(Boolean).join(' ')
      }

      // Build filters object - ensure numbers are properly typed
      // Convert to numbers explicitly to ensure backend receives correct types
      const pageNum = parseInt(String(currentPage), 10) || 1
      const limitNum = parseInt(String(PAGE_SIZE), 10) || 20
      
      // Validate salary inputs - ensure they are positive numbers
      const salaryMinNum = salaryMin && !isNaN(parseFloat(salaryMin)) && parseFloat(salaryMin) >= 0
        ? parseInt(String(salaryMin), 10)
        : undefined
      const salaryMaxNum = salaryMax && !isNaN(parseFloat(salaryMax)) && parseFloat(salaryMax) >= 0
        ? parseInt(String(salaryMax), 10)
        : undefined
      
      const filters = {
        page: pageNum,
        limit: limitNum,
        search: searchQuery || undefined,
        skill_names: skillNames,
        location_name: locationName,
        location_id: locationId || undefined,
        job_type: jobTypeFilter,
        experience_level: experienceLevelValue !== null ? Number(experienceLevelValue) : undefined,
        salary_min: salaryMinNum,
        salary_max: salaryMaxNum,
        sort_by: sortOption.sort_by,
        sort_order: sortOption.sort_order
      }

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
          delete filters[key]
        }
      })
      
      // Debug: log filters to ensure correct types (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Filters being sent:', filters)
        console.log('Page type:', typeof filters.page, 'Value:', filters.page)
        console.log('Limit type:', typeof filters.limit, 'Value:', filters.limit)
      }

      const response = await JobService.list(filters)
      
      // Handle response format: { message, data, pagination }
      // Backend returns: { message: string, data: Job[], pagination: { page, limit, total, total_pages } }
      const jobsList = Array.isArray(response?.data) ? response.data : []
      
      if (jobsList.length === 0 && currentPage === 1) {
        // No jobs found on first page - this is valid, not an error
        setJobs([])
        setPagination(response?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })
        setError('')
      } else {
        const mappedJobs = jobsList.map(mapJobData)
        setJobs(mappedJobs)
        setPagination(response?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })
        setError('') // Clear error on success
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
      console.error('Error details:', {
        message: err?.message,
        status: err?.status,
        data: err?.data
      })
      const errorMessage = err?.message || err?.data?.message || 'Failed to load jobs. Please check your connection and try again.'
      setError(errorMessage)
      // Fallback to sample data on error
      setJobs(SAMPLE_JOBS)
      setPagination({ page: 1, limit: PAGE_SIZE, total: SAMPLE_JOBS.length, total_pages: 1 })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedKeyword, sortOrder, locationId, locationFilter, selectedJobTypes, experienceLevel, salaryMin, salaryMax, skills])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [debouncedKeyword, sortOrder, locationId, locationFilter, selectedJobTypes, experienceLevel, salaryMin, salaryMax, skills])

  const toggleJobType = (value) => {
    setSelectedJobTypes((prev) => {
      const newTypes = prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
      // Reset page when filter changes
      if (currentPage !== 1) setCurrentPage(1)
      return newTypes
    })
  }

  const addSkill = () => {
    const val = skillInput.trim()
    if (!val) return
    if (skills.includes(val)) return // Don't add duplicates
    setSkills((prev) => [...prev, val])
    setSkillInput('')
    // Reset to page 1 when adding skill
    if (currentPage !== 1) setCurrentPage(1)
  }

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
    // Reset to page 1 when removing skill
    if (currentPage !== 1) setCurrentPage(1)
  }

  // Handle location filter change - for now we use text search
  // In the future, this could be enhanced to use location_id when location selection is implemented
  const handleLocationChange = (value) => {
    setLocationFilter(value)
    // Reset locationId when text changes (could be enhanced to search for location_id)
    setLocationId('')
    if (currentPage !== 1) setCurrentPage(1)
  }

  return (
    <div className="jobs-page">
      <div className="jobs-container">
        <header className="jobs-page__header">
          <div>
            <h1>Việc làm</h1>
            <p className="subtitle">Khám phá những cơ hội mới nhất</p>
          </div>
          <div className="jobs-page__controls">
            <input
              type="text"
              placeholder="Tìm theo vị trí hoặc công ty"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="jobs-page__layout">
          <aside className="jobs-page__sidebar">
            <JobsSidebarFilters
              isMobileOpen={filtersOpen}
              onToggleMobile={() => setFiltersOpen((o) => !o)}
              locationFilter={locationFilter}
              onLocationChange={handleLocationChange}
              selectedJobTypes={selectedJobTypes}
              onToggleJobType={toggleJobType}
              experienceLevel={experienceLevel}
              onExperienceChange={(value) => {
                setExperienceLevel(value)
                if (currentPage !== 1) setCurrentPage(1)
              }}
              salaryMin={salaryMin}
              salaryMax={salaryMax}
              onSalaryMinChange={(value) => {
                setSalaryMin(value)
                if (currentPage !== 1) setCurrentPage(1)
              }}
              onSalaryMaxChange={(value) => {
                setSalaryMax(value)
                if (currentPage !== 1) setCurrentPage(1)
              }}
              skills={skills}
              skillInput={skillInput}
              onSkillInputChange={setSkillInput}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
              jobTypes={JOB_TYPES}
              experienceOptions={EXPERIENCE_LEVELS}
            />
          </aside>

          <main className="jobs-page__content">
            <JobsList
              jobs={jobs}
              totalPages={pagination.total_pages || 1}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              error={error}
              onRetry={fetchJobs}
              showPagination={pagination.total_pages > 1}
              JobCardComponent={JobCard}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
