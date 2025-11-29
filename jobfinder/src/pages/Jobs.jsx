import React, { useCallback, useEffect, useMemo, useState } from 'react'
import JobCard from '../components/JobCard.jsx'
import JobsSidebarFilters from './JobsSidebarFilters.jsx'
import JobsList from './JobsList.jsx'
import { JobService } from '../lib/api.js'
import './JobsPage.css'
import './JobsStates.css'

const PAGE_SIZE = 10
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'salaryHigh', label: 'Lương cao nhất' },
  { value: 'salaryLow', label: 'Lương thấp nhất' }
]
const JOB_TYPES = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'intern', label: 'Thực tập' },
  { value: 'freelance', label: 'Freelance' }
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

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [locationFilter, setLocationFilter] = useState('')
  const [selectedJobTypes, setSelectedJobTypes] = useState([])
  const [experienceLevel, setExperienceLevel] = useState('any')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await JobService.list()
      const jobsList = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setJobs(jobsList)
    } catch (err) {
      setError(err?.message || 'Failed to load jobs')
      setJobs(SAMPLE_JOBS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    setCurrentPage(1)
  }, [keyword, sortOrder, locationFilter, selectedJobTypes, experienceLevel, salaryMin, salaryMax, skills])

  const toggleJobType = (value) => {
    setSelectedJobTypes((prev) => (prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]))
  }

  const addSkill = () => {
    const val = skillInput.trim()
    if (!val) return
    setSkills((prev) => (prev.includes(val) ? prev : [...prev, val]))
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const filteredJobs = useMemo(() => {
    const keywordLc = keyword.trim().toLowerCase()
    const locLc = locationFilter.trim().toLowerCase()

    const meetsText = (job) =>
      !keywordLc ||
      job.title.toLowerCase().includes(keywordLc) ||
      job.companyName.toLowerCase().includes(keywordLc)

    const meetsLocation = (job) => !locLc || job.location.toLowerCase().includes(locLc)

    const meetsJobType = (job) => selectedJobTypes.length === 0 || selectedJobTypes.includes(job.jobType)

    const meetsExperience = (job) => experienceLevel === 'any' || job.experienceLevel === experienceLevel

    const meetsSalary = (job) => {
      const jobMin = job.salaryMin
      const jobMax = job.salaryMax
      const minFilter = salaryMin === '' ? null : Number(salaryMin)
      const maxFilter = salaryMax === '' ? null : Number(salaryMax)

      if (minFilter != null && minFilter !== '') {
        const upper = jobMax ?? jobMin ?? -Infinity
        if (upper < minFilter) return false
      }
      if (maxFilter != null && maxFilter !== '') {
        const lower = jobMin ?? jobMax ?? Infinity
        if (lower > maxFilter) return false
      }
      return true
    }

    const meetsSkills = (job) => {
      if (!skills.length) return true
      const jobSkills = (job.skills || []).map((s) => s.toLowerCase())
      return skills.every((skill) => jobSkills.includes(skill.toLowerCase()))
    }

    return jobs
      .filter((job) => meetsText(job) && meetsLocation(job) && meetsJobType(job) && meetsExperience(job) && meetsSalary(job) && meetsSkills(job))
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
        if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
        if (sortOrder === 'salaryHigh') {
          const aVal = a.salaryMax ?? a.salaryMin ?? -Infinity
          const bVal = b.salaryMax ?? b.salaryMin ?? -Infinity
          return bVal - aVal
        }
        if (sortOrder === 'salaryLow') {
          const aVal = a.salaryMin ?? a.salaryMax ?? Infinity
          const bVal = b.salaryMin ?? b.salaryMax ?? Infinity
          return aVal - bVal
        }
        return 0
      })
  }, [jobs, keyword, locationFilter, selectedJobTypes, experienceLevel, salaryMin, salaryMax, skills, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const visibleJobs = filteredJobs.slice(pageStart, pageStart + PAGE_SIZE)

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
              onLocationChange={setLocationFilter}
              selectedJobTypes={selectedJobTypes}
              onToggleJobType={toggleJobType}
              experienceLevel={experienceLevel}
              onExperienceChange={setExperienceLevel}
              salaryMin={salaryMin}
              salaryMax={salaryMax}
              onSalaryMinChange={setSalaryMin}
              onSalaryMaxChange={setSalaryMax}
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
              jobs={visibleJobs}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
              error={error}
              onRetry={fetchJobs}
              showPagination={filteredJobs.length > PAGE_SIZE}
              JobCardComponent={JobCard}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
