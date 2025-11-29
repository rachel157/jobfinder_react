import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { JobService } from '../lib/api'
import './JobDetailsPage.css'

const EXPERIENCE_LABELS = {
  any: 'Bất kỳ',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior'
}

const JOB_TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  intern: 'Thực tập',
  freelance: 'Freelance'
}

const SAMPLE_JOB_DETAILS = {
  'frontend-engineer': {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    company: {
      id: 'lumatech',
      name: 'Luma Tech',
      logoUrl: '',
      size: '100-200',
      description: 'Xây dựng ứng dụng web nhanh, hiện đại cho nền tảng SaaS.',
      contactEmail: 'hr@lumatech.io',
      contactPhone: '+84 24 0000 000',
      contactAddress: 'Hà Nội, Việt Nam'
    },
    location: { name: 'Hà Nội, Việt Nam' },
    salaryRange: { min: 1800, max: 2500, currency: 'USD', period: 'month' },
    jobType: 'full_time',
    experienceLevel: 'mid',
    description:
      'Thiết kế và triển khai giao diện với React/TypeScript. Phối hợp thiết kế và backend để tối ưu hiệu năng.',
    requirements: [
      { title: '3+ năm với React', isRequired: true, yearsExperience: 3, description: 'Thành thạo hooks và tối ưu hiệu năng.' },
      { title: 'TypeScript', isRequired: true, description: 'Hiểu typing nâng cao và linting.' },
      { title: 'Design system', isRequired: false, description: 'Biết dùng token và component tái sử dụng.' }
    ],
    skills: ['React', 'TypeScript', 'CSS'],
    tags: ['Frontend', 'SaaS', 'Remote'],
    benefits: [
      { title: 'Remote linh hoạt', description: 'Hỗ trợ thiết bị làm việc tại nhà.' },
      { title: 'Ngân sách học tập', description: '$1,000/năm cho khoá học và hội thảo.' }
    ],
    workArrangement: {
      isRemoteAllowed: true,
      remotePercentage: 60,
      flexibleHours: true,
      overtimeExpected: false,
      travelRequirement: 'Thỉnh thoảng on-site',
      shiftType: 'Giờ hành chính'
    },
    postedAt: '2025-01-05T08:00:00Z',
    expiresAt: '2025-03-01T08:00:00Z',
    stats: { views: 1200, applicants: 32 },
    status: 'open'
  },
  'backend-developer': {
    id: 'backend-developer',
    title: 'Backend Developer',
    company: {
      id: 'oceansoft',
      name: 'OceanSoft',
      logoUrl: '',
      size: '80-150',
      description: 'Phát triển API cho sản phẩm logistics và thương mại.',
      contactEmail: 'jobs@oceansoft.vn',
      contactPhone: '+84 23 1234 567',
      contactAddress: 'Đà Nẵng, Việt Nam'
    },
    location: { name: 'Đà Nẵng, Việt Nam' },
    salaryRange: { min: 1700, max: 2600, currency: 'USD', period: 'month' },
    jobType: 'full_time',
    experienceLevel: 'mid',
    description: 'Xây dựng và mở rộng API với Node.js/Postgres. Chịu trách nhiệm end-to-end.',
    requirements: [
      { title: 'Node.js/TypeScript', isRequired: true, yearsExperience: 3 },
      { title: 'SQL & Postgres', isRequired: true, description: 'Tối ưu truy vấn và thiết kế schema.' },
      { title: 'Docker cơ bản', isRequired: false }
    ],
    skills: ['Node.js', 'Postgres', 'Docker'],
    tags: ['API', 'Backend', 'Cloud'],
    benefits: [
      { title: 'Bảo hiểm sức khỏe', description: 'Cho bản thân và gia đình.' },
      { title: 'Thưởng quý', description: 'Dựa trên hiệu suất.' }
    ],
    workArrangement: {
      isRemoteAllowed: true,
      remotePercentage: 40,
      flexibleHours: true,
      overtimeExpected: false,
      travelRequirement: 'Hiếm khi',
      shiftType: 'Giờ hành chính'
    },
    postedAt: '2025-01-20T08:00:00Z',
    expiresAt: '2025-03-20T08:00:00Z',
    stats: { views: 980, applicants: 21 },
    status: 'open'
  },
  'product-designer': {
    id: 'product-designer',
    title: 'Product Designer',
    company: {
      id: 'novalabs',
      name: 'Nova Labs',
      logoUrl: '',
      size: '50-100',
      description: 'Thiết kế trải nghiệm chuẩn B2C cho khách hàng B2B.',
      contactEmail: 'hello@novalabs.vn',
      contactAddress: 'TP. Hồ Chí Minh, Việt Nam'
    },
    location: { name: 'TP. Hồ Chí Minh, Việt Nam' },
    salaryRange: { min: 1500, max: 2200, currency: 'USD', period: 'month' },
    jobType: 'part_time',
    experienceLevel: 'senior',
    description: 'Dẫn dắt discovery, tạo luồng sản phẩm trực quan và triển khai UI sắc nét.',
    requirements: [
      { title: 'Portfolio sản phẩm', isRequired: true },
      { title: 'Thành thạo Figma', isRequired: true },
      { title: 'Research & testing', isRequired: false }
    ],
    skills: ['Figma', 'UX', 'Research'],
    tags: ['Design', 'UX', 'UI'],
    benefits: [
      { title: 'Giờ giấc linh hoạt', description: 'Chủ động sắp xếp lịch.' },
      { title: 'Hỗ trợ thiết bị', description: 'Cung cấp laptop và phụ kiện.' }
    ],
    workArrangement: {
      isRemoteAllowed: true,
      remotePercentage: 80,
      flexibleHours: true,
      overtimeExpected: false,
      travelRequirement: 'Tuỳ chọn',
      shiftType: 'Giờ hành chính'
    },
    postedAt: '2025-01-12T08:00:00Z',
    expiresAt: '2025-03-10T08:00:00Z',
    stats: { views: 540, applicants: 18 },
    status: 'open'
  }
}

const formatSalary = (range) => {
  if (!range) return 'Thỏa thuận'
  const { min, max, currency = 'USD', period = 'month' } = range
  const formatter = new Intl.NumberFormat('en-US')
  const suffix = period ? ` / ${period === 'month' ? 'tháng' : period}` : ''
  if (min != null && max != null) return `${formatter.format(min)} - ${formatter.format(max)} ${currency}${suffix}`
  if (min != null) return `${formatter.format(min)} ${currency}${suffix}`
  if (max != null) return `${formatter.format(max)} ${currency}${suffix}`
  return 'Thỏa thuận'
}

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const statusLabel = (status) => {
  const map = { open: 'Đang tuyển', closed: 'Đã đóng', draft: 'Nháp', paused: 'Tạm dừng' }
  return map[status?.toLowerCase()] || (status ? status : 'Đang tuyển')
}

const statusClass = (status) => {
  const normalized = status?.toLowerCase()
  if (normalized === 'open') return 'status-open'
  if (normalized === 'closed') return 'status-closed'
  if (normalized === 'paused') return 'status-paused'
  return 'status-default'
}

const normalizeJob = (payload) => {
  const raw = payload?.data ?? payload
  if (!raw) return null

  const salaryRange =
    raw.salaryRange ||
    (raw.salary_range
      ? {
          min: raw.salary_range.min,
          max: raw.salary_range.max,
          currency: raw.salary_range.currency || raw.currency || 'USD',
          period: raw.salary_range.period || raw.period || 'month'
        }
      : raw.salaryMin != null || raw.salaryMax != null || raw.salary_min != null || raw.salary_max != null
      ? {
          min: raw.salaryMin ?? raw.salary_min ?? null,
          max: raw.salaryMax ?? raw.salary_max ?? null,
          currency: raw.currency || raw.salaryCurrency || 'USD',
          period: raw.salaryPeriod || 'month'
        }
      : null)

  const companyId = raw.companyId || raw.company_id || raw.company?.id

  const company =
    raw.company && typeof raw.company === 'object'
      ? { id: companyId || raw.company.id, ...raw.company }
      : raw.companyName
      ? { id: companyId, name: raw.companyName, logoUrl: raw.companyLogoUrl }
      : raw.company
      ? { id: companyId, name: raw.company }
      : null

  const location =
    typeof raw.location === 'string'
      ? { name: raw.location }
      : raw.location && typeof raw.location === 'object'
      ? raw.location
      : raw.locationName
      ? { name: raw.locationName }
      : null

  return {
    ...raw,
    salaryRange,
    company,
    location,
    workArrangement: raw.workArrangement || raw.work_arrangement || raw.workSetting,
    companyId: companyId || raw.companyId || raw.company_id
  }
}

export default function JobDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [highlightCompany, setHighlightCompany] = useState(false)
  const companySectionRef = useRef(null)
  const highlightTimer = useRef(null)

  const fetchJob = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await JobService.detail(id)
      const normalized = normalizeJob(data)
      if (!normalized) throw new Error('Không tìm thấy tin tuyển dụng')
      setJob(normalized)
    } catch (err) {
      const fallback = normalizeJob(SAMPLE_JOB_DETAILS[id])
      if (fallback) {
        setJob(fallback)
        setError('')
      } else {
        setError(err?.message || 'Không tải được tin tuyển dụng')
        setJob(null)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    }
  }, [])

  const isOpen = (job?.status || '').toLowerCase() === 'open'
  const mustHave = useMemo(() => (job?.requirements || []).filter((req) => req?.isRequired), [job])
  const niceToHave = useMemo(() => (job?.requirements || []).filter((req) => !req?.isRequired), [job])
  const salaryText = formatSalary(job?.salaryRange)
  const skills = job?.skills || []
  const tags = job?.tags || []

  const experienceLabel = EXPERIENCE_LABELS[job?.experienceLevel] || job?.experienceLevel || 'Bất kỳ'
  const jobTypeLabel = JOB_TYPE_LABELS[job?.jobType] || job?.jobType || 'Công việc'

  const handleShare = async () => {
    const shareData = {
      title: job?.title || 'Tin tuyển dụng',
      text: job?.company?.name ? `${job.title} - ${job.company.name}` : job?.title,
      url: window.location.href
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url)
        alert('Đã sao chép liên kết')
      }
    } catch (_) {
      /* ignore */
    }
  }

  const handleApply = () => {
    if (!isOpen) return
    alert('Luồng ứng tuyển chưa được kết nối.')
  }

  const handleViewCompany = () => {
    if (!companySectionRef.current) return
    companySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setHighlightCompany(true)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightCompany(false), 1200)
  }

  const handleOpenCompany = () => {
    const companyId = job?.company?.id || job?.companyId || job?.company_id
    if (!companyId) {
      alert('Chưa có thông tin công ty.')
      return
    }
    navigate(`/companies/${companyId}`)
  }

  if (loading) {
    return (
      <div className="job-details-page">
        <div className="container">
          <div className="state-card">Đang tải chi tiết công việc...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="job-details-page">
        <div className="container">
          <div className="state-card error">
            <p>{error}</p>
            <button className="btn primary" onClick={fetchJob}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="job-details-page">
      <div className="container">
        <header className="job-header section-card">
          <div className="job-header__left">
            <div className="job-logo">
              {job?.company?.logoUrl ? (
                <img src={job.company.logoUrl} alt={job.company.name || 'Company logo'} />
              ) : (
                <span>{(job?.company?.name || 'C')?.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1>{job.title}</h1>
              <p className="muted">
                {job?.company?.name || 'Chưa cập nhật'} | {job?.location?.name || 'Làm việc từ xa'}
              </p>
              <div className="meta-row">
                <span className="badge">{jobTypeLabel}</span>
                <span className="badge secondary">{experienceLabel}</span>
                <span className="badge ghost">{salaryText}</span>
                {job.postedAt && <span className="muted">Đăng {formatDate(job.postedAt)}</span>}
              </div>
            </div>
          </div>
          <div className={`status-badge ${statusClass(job.status)}`}>{statusLabel(job.status)}</div>
        </header>

        <div className="action-bar section-card balanced">
          <div className="action-buttons">
            <button className="btn primary" onClick={handleApply} disabled={!isOpen}>
              Ứng tuyển ngay
            </button>
            <button className="btn ghost" onClick={() => setSaved((s) => !s)}>
              {saved ? 'Đã lưu' : 'Lưu tin'}
            </button>
            <button className="btn ghost" onClick={handleShare}>
              Chia sẻ
            </button>
            <button className="btn ghost" onClick={handleViewCompany}>
              Xem nhanh công ty
            </button>
            <button className="btn ghost" onClick={handleOpenCompany}>
              Đến trang công ty
            </button>
          </div>
          <div className="muted stats-text">
            {(job?.stats?.views ?? 0).toLocaleString()} lượt xem | {(job?.stats?.applicants ?? 0).toLocaleString()} ứng viên
          </div>
        </div>

        <div className="details-grid wide">
          <main className="details-main">
            <section className="section-card">
              <div className="section-head">
                <h3>Mô tả công việc</h3>
              </div>
              <p className="description-text">{job.description || 'Chưa có mô tả.'}</p>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Yêu cầu</h3>
              </div>
              <div className="requirements-grid">
                <div>
                  <h4>Bắt buộc</h4>
                  {mustHave.length ? (
                    <ul className="bullet-list">
                      {mustHave.map((item, idx) => (
                        <li key={`must-${idx}`}>
                          <div className="req-title">{item.title}</div>
                          {item.description && <p className="muted">{item.description}</p>}
                          {item.yearsExperience ? <span className="pill-chip">{item.yearsExperience}+ năm</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Chưa có yêu cầu bắt buộc.</p>
                  )}
                </div>
                <div>
                  <h4>Ưu tiên</h4>
                  {niceToHave.length ? (
                    <ul className="bullet-list">
                      {niceToHave.map((item, idx) => (
                        <li key={`nice-${idx}`}>
                          <div className="req-title">{item.title}</div>
                          {item.description && <p className="muted">{item.description}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">Chưa có yêu cầu bổ sung.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Kỹ năng & thẻ</h3>
              </div>
              <div className="chips-row">
                {[...skills, ...tags].map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
                {!skills.length && !tags.length && <p className="muted">Chưa có kỹ năng.</p>}
              </div>
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Quyền lợi</h3>
              </div>
              {job?.benefits?.length ? (
                <ul className="benefits-list">
                  {job.benefits.map((benefit, idx) => (
                    <li key={`benefit-${idx}`}>
                      <div>
                        <div className="benefit-title">{benefit.title}</div>
                        {benefit.description && <p className="muted">{benefit.description}</p>}
                      </div>
                      {benefit.valueAmount != null && (
                        <span className="pill-chip">
                          {benefit.valueAmount} {benefit.valueCurrency || ''}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Chưa có quyền lợi.</p>
              )}
            </section>

            <section className="section-card">
              <div className="section-head">
                <h3>Hình thức làm việc</h3>
              </div>
              <div className="work-grid">
                <div className="work-item">
                  <span className="work-label">Làm từ xa</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.isRemoteAllowed ? 'Có' : 'Tại văn phòng'}</strong>
                    {job?.workArrangement?.remotePercentage != null && (
                      <>
                        <span className="work-divider">|</span>
                        <strong>{job.workArrangement.remotePercentage}%</strong>
                      </>
                    )}
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Giờ giấc linh hoạt</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.flexibleHours ? 'Có' : 'Không'}</strong>
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Làm thêm</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.overtimeExpected ? 'Có' : 'Không'}</strong>
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Công tác</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.travelRequirement || 'Chưa rõ'}</strong>
                  </span>
                </div>
                <div className="work-item">
                  <span className="work-label">Ca làm</span>
                  <span className="work-value">
                    <strong>{job?.workArrangement?.shiftType || 'Chưa rõ'}</strong>
                  </span>
                </div>
              </div>
            </section>
          </main>

          <aside className="details-sidebar sticky">
            <section className="section-card">
              <div className="section-head">
                <h3>Thông tin nhanh</h3>
              </div>
              <div className="quick-info">
                <div>
                  <span className="muted">Mức lương</span>
                  <strong>{salaryText}</strong>
                </div>
                <div>
                  <span className="muted">Hình thức</span>
                  <strong>{jobTypeLabel}</strong>
                </div>
                <div>
                  <span className="muted">Kinh nghiệm</span>
                  <strong>{experienceLabel}</strong>
                </div>
                <div>
                  <span className="muted">Địa điểm</span>
                  <strong>{job?.location?.name || 'Làm việc từ xa'}</strong>
                </div>
                <div>
                  <span className="muted">Ngày đăng</span>
                  <strong>{formatDate(job?.postedAt) || 'N/A'}</strong>
                </div>
                <div>
                  <span className="muted">Hạn ứng tuyển</span>
                  <strong>{formatDate(job?.expiresAt) || 'N/A'}</strong>
                </div>
              </div>
              <div className="sidebar-actions">
                <button className="btn primary" disabled={!isOpen} onClick={handleApply}>
                  Ứng tuyển ngay
                </button>
                <button className="btn ghost" onClick={handleShare}>
                  Chia sẻ
                </button>
              </div>
            </section>

            <section
              ref={companySectionRef}
              className={`section-card company-card ${highlightCompany ? 'is-highlighted' : ''}`}
            >
              <div className="section-head">
                <h3>Công ty</h3>
                <button className="btn ghost small" onClick={handleOpenCompany}>
                  Xem chi tiết
                </button>
              </div>
              <div className="company-header">
                <div className="company-logo">
                  {job?.company?.logoUrl ? (
                    <img src={job.company.logoUrl} alt={job.company.name || 'Company logo'} />
                  ) : (
                    <span>{(job?.company?.name || 'C')?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <strong>{job?.company?.name || 'Chưa cập nhật'}</strong>
                  {job?.company?.size && <p className="muted">Quy mô: {job.company.size}</p>}
                </div>
              </div>
              {job?.company?.description && <p className="muted">{job.company.description}</p>}

              <div className="company-info">
                {job?.company?.contactEmail && (
                  <div>
                    <span className="muted">Email</span>
                    <strong>{job.company.contactEmail}</strong>
                  </div>
                )}
                {job?.company?.contactPhone && (
                  <div>
                    <span className="muted">Điện thoại</span>
                    <strong>{job.company.contactPhone}</strong>
                  </div>
                )}
                {job?.company?.contactAddress && (
                  <div>
                    <span className="muted">Địa chỉ</span>
                    <strong>{job.company.contactAddress}</strong>
                  </div>
                )}
              </div>

              {(job?.company?.linkedinUrl || job?.company?.facebookUrl || job?.company?.twitterUrl) && (
                <div className="social-links">
                  {job.company.linkedinUrl && (
                    <a href={job.company.linkedinUrl} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  )}
                  {job.company.facebookUrl && (
                    <a href={job.company.facebookUrl} target="_blank" rel="noreferrer">
                      Facebook
                    </a>
                  )}
                  {job.company.twitterUrl && (
                    <a href={job.company.twitterUrl} target="_blank" rel="noreferrer">
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
