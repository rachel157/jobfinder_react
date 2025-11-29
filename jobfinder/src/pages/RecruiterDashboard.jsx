import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { AuthClient } from "../services/authClient"
import { getAuthUser, getRefreshToken, logout as clearAuth } from "../auth/auth"
import { companyApi } from "../services/companyApi"
import "./recruiter-dashboard.css"

// Keep in sync with RecruiterCompanyPage to avoid mismatched completion %
const profileFieldsCompany = [
  "name",
  "description",
  "size",
  "contact_email",
  "contact_phone",
  "contact_address",
  "linkedin_url",
  "facebook_url",
  "twitter_url",
  "tax_code",
  "business_license",
]
const profileFieldsDetails = [
  "industry",
  "company_type",
  "founded_year",
  "employee_count_min",
  "employee_count_max",
  "website_url",
  "revenue_range",
  "stock_symbol",
  "culture_description",
  "headquarters_location_id",
]
const computeProfileCompletion = (company, details) => {
  let filled = 0
  const total = profileFieldsCompany.length + profileFieldsDetails.length
  const det = details || company?.company_details || {}

  profileFieldsCompany.forEach((key) => {
    const val = company?.[key]
    if (val !== undefined && val !== null && String(val).trim() !== "") filled += 1
  })
  profileFieldsDetails.forEach((key) => {
    const val = det?.[key]
    if (val !== undefined && val !== null && String(val).trim() !== "") filled += 1
  })

  const percent = total > 0 ? Math.round((filled / total) * 100) : 0
  return { filled, total, percent }
}

const navItems = [
  { label: "Bảng điều khiển", icon: "[DB]", path: "/recruiter/dashboard" },
  { label: "Tin tuyển dụng", icon: "[JD]", path: "/post-job" },
  { label: "Ứng viên", icon: "[UV]", path: "/recruiter/dashboard" },
  { label: "Talent pool", icon: "[TP]", path: "/recruiter/dashboard" },
  { label: "Hồ sơ công ty", icon: "[CT]", path: "/recruiter/company" },
]

const statCards = [
  { label: "Tin đang hoạt động", value: 8, trend: "+12%", direction: "up" },
  { label: "Tin nháp", value: 3, trend: "-5%", direction: "down" },
  { label: "Ứng tuyển đang mở", value: 128, trend: "+4%", direction: "up" },
  { label: "Offer chấp nhận (30 ngày)", value: 6, trend: "+2%", direction: "up" },
]

const pipelineStatuses = [
  { key: "pending", label: "Đang chờ" },
  { key: "reviewed", label: "Đã xem" },
  { key: "accepted", label: "Chấp nhận" },
  { key: "rejected", label: "Từ chối" },
]

const pipelineItems = [
  { name: "Trần Lệ Ngân", job: "Product Designer", status: "pending", appliedAt: "2 ngày trước" },
  { name: "Đỗ Minh Hoàng", job: "Frontend Engineer", status: "pending", appliedAt: "1 ngày trước" },
  { name: "Nguyễn Phúc Thịnh", job: "QA Engineer", status: "reviewed", appliedAt: "3 ngày trước" },
  { name: "Lê Sương Giang", job: "Backend Engineer", status: "accepted", appliedAt: "5 ngày trước" },
  { name: "Trần Tường Vy", job: "Product Manager", status: "rejected", appliedAt: "1 tuần trước" },
]

const recentApplications = [
  { id: 1, candidate: "Lê Hồng Phúc", job: "Senior Backend Engineer", status: "Đã xem", stage: "Phỏng vấn kỹ thuật", applied: "12/07/2025" },
  { id: 2, candidate: "Đào Thùy Dương", job: "UI/UX Designer", status: "Đang chờ", stage: "Sàng lọc", applied: "11/07/2025" },
  { id: 3, candidate: "Phan Phúc Long", job: "DevOps Engineer", status: "Chấp nhận", stage: "Offer", applied: "10/07/2025" },
  { id: 4, candidate: "Đặng Mỹ Tiên", job: "Mobile Engineer", status: "Từ chối", stage: "Gọi điện", applied: "09/07/2025" },
]

const jobRows = [
  { id: 1, title: "Senior Backend Engineer", status: "Đã duyệt", type: "Toàn thời gian", location: "Hồ Chí Minh", posted: "01/07/2025", expires: "01/09/2025", applications: 48, views: 820 },
  { id: 2, title: "Product Designer", status: "Nháp", type: "Hybrid", location: "Remote", posted: "--", expires: "--", applications: 0, views: 0 },
  { id: 3, title: "QA Engineer", status: "Đã duyệt", type: "Onsite", location: "Hà Nội", posted: "25/06/2025", expires: "25/08/2025", applications: 23, views: 405 },
]

const topCandidates = [
  { name: "Tạ Hồng Ngọc", role: "Product Design Lead", looking: true, skills: ["Figma", "Research", "Illustrator"], applications: 2, latestStatus: "Đã xem" },
  { name: "Đào Thanh Sơn", role: "Senior Backend Engineer", looking: true, skills: ["NestJS", "Postgres", "AWS"], applications: 3, latestStatus: "Đang chờ" },
  { name: "Lưu Gia Phát", role: "QA Automation", looking: false, skills: ["Playwright", "Cypress"], applications: 1, latestStatus: "Chấp nhận" },
]

const savedCandidates = [
  { name: "Đinh Thảo Vy", role: "Product Manager", savedJob: "Product Manager", skills: ["Roadmap", "OKRs"] },
  { name: "Đặng Quốc Huy", role: "Data Engineer", savedJob: "Data Engineer", skills: ["Airflow", "Python", "Snowflake"] },
]

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [company, setCompany] = useState(null)
  const [details, setDetails] = useState(null)

  const pipelineBuckets = useMemo(
    () =>
      pipelineStatuses.reduce((acc, status) => {
        acc[status.key] = pipelineItems.filter((item) => item.status === status.key)
        return acc
      }, {}),
    []
  )

  const authUser = getAuthUser() || {}
  useEffect(() => {
    let active = true
    const loadCompany = async () => {
      try {
        const data = await companyApi.getMyCompany()
        if (active) setCompany(data)
      } catch {
        if (active) setCompany(null)
      }
      try {
        const det = await companyApi.getMyCompanyDetails()
        if (active) setDetails(det)
      } catch {
        if (active) setDetails(null)
      }
    }
    loadCompany()
    return () => {
      active = false
    }
  }, [])

  const completion = computeProfileCompletion(company, details)
  const completionPercent = completion.percent

  const displayName = company?.name || authUser?.name || "Nhà tuyển dụng"
  const roleLabel = authUser?.role === "employer" ? "Nhà tuyển dụng" : authUser?.role || "Nhà tuyển dụng"
  const avatarUrl = company?.logo_url || authUser?.avatar
  const avatarFallback = (company?.name || displayName || "R")?.trim()?.charAt(0)?.toUpperCase() || "R"

  const goToChangePassword = () => {
    setProfileOpen(false)
    navigate("/recruiter/change-password")
  }

  const handleLogout = async () => {
    setProfileOpen(false)
    try {
      const refresh = getRefreshToken()
      if (refresh) {
        await AuthClient.logout(refresh)
      }
    } catch (error) {
      console.warn("Đăng xuất recruiter thất bại:", error?.message)
    } finally {
      clearAuth()
      navigate("/login", { replace: true })
    }
  }

  return (
    <div className="rd-shell">
      <header className="rd-navbar">
        <div className="rd-logo-block">
          <button
            className="rd-hamburger"
            type="button"
            aria-label="Thu gọn menu"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="rd-logo">
            <span className="rd-logo-badge">JP</span>
            <div>
              <strong>JobFinder Recruiter</strong>
              <p>Khu vực nhà tuyển dụng</p>
            </div>
          </div>
        </div>
        {completionPercent < 100 && (
          <div
            className="rd-banner warning"
            style={{ borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}
          >
            <div>
              <strong>Hồ sơ công ty mới hoàn thành {completionPercent}%</strong>
              <div className="muted" style={{ margin: 0 }}>
                Hoàn thiện hồ sơ để được duyệt và đăng tin.
              </div>
            </div>
            <div style={{ flex: "0 0 200px", background: "#e2e8f0", height: 8, borderRadius: 999 }}>
              <div
                style={{
                  width: `${completionPercent}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg,#4f8bff,#2f64f2)",
                }}
              />
            </div>
          </div>
        )}
        <div className="rd-nav-actions">
          <button className="rd-icon-btn" aria-label="Trợ giúp">
            ?
          </button>
          <button className="rd-icon-btn" aria-label="Thông báo">
            <span className="rd-dot" />
            🔔
          </button>
          <div className="rd-user-menu">
            <div className="rd-user-pill" onClick={() => setProfileOpen((open) => !open)}>
              <div className="rd-avatar">
                {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : <span>{avatarFallback}</span>}
              </div>
              <div>
                <strong>{displayName}</strong>
                <small>{roleLabel}</small>
              </div>
              <span className="rd-chevron">▼</span>
            </div>
            {profileOpen && (
              <div className="rd-profile-menu">
                <button type="button" onClick={() => navigate("/recruiter/company")}>Hồ sơ công ty</button>
                <button type="button" onClick={goToChangePassword}>Đổi mật khẩu</button>
                <button type="button" className="danger" onClick={handleLogout}>Đăng xuất</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="rd-layout">
        <aside className={`rd-sidebar${sidebarOpen ? " is-open" : ""}`}>
          {(() => {
            const firstMatchIndex = navItems.findIndex((n) => n.path === location.pathname)
            return navItems.map((item, index) => {
              const isActive = location.pathname === item.path && index === firstMatchIndex
              return (
                <button
                  key={item.label}
                  className={`rd-nav-item${isActive ? " active" : ""}`}
                  type="button"
                  onClick={() => navigate(item.path)}
                >
                  <span className="rd-nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              )
            })
          })()}
        </aside>

        <main className="rd-main">
          <section className="rd-card rd-hero-card">
            <div>
              <p className="rd-eyebrow">Xin chào</p>
              <h1>
                {displayName} <span aria-hidden="true">👋</span>
              </h1>
              <p>Theo dõi tiến độ tuyển dụng và quản lý pipeline của bạn.</p>
              <div className="rd-chip-row">
                <button className="rd-secondary-btn" onClick={() => navigate("/recruiter/company")}>
                  Quản lý hồ sơ công ty
                </button>
                <button className="rd-secondary-btn" onClick={() => navigate("/onboarding/company")}>
                  Tạo hồ sơ công ty
                </button>
              </div>
            </div>
            <button className="rd-primary-btn" onClick={() => navigate("/post-job")}>
              Đăng tin mới
            </button>
          </section>

          <section className="rd-grid rd-grid--stats">
            {statCards.map((stat) => (
              <article key={stat.label} className="rd-card">
                <p className="rd-label">{stat.label}</p>
                <p className="rd-value">{stat.value}</p>
                <p className={`rd-trend ${stat.direction === "up" ? "up" : "down"}`}>
                  {stat.trend} so với kỳ trước
                </p>
              </article>
            ))}
          </section>

          <section className="rd-card">
            <div className="rd-card__head">
              <div>
                <h2>Pipeline ứng tuyển</h2>
                <p className="rd-muted">Theo dõi trạng thái ứng viên theo từng giai đoạn.</p>
              </div>
              <div className="rd-filters">
                <select>
                  <option>Tất cả công việc</option>
                  <option>Backend Engineer</option>
                  <option>Product Designer</option>
                </select>
                <select>
                  <option>Tất cả trạng thái</option>
                  <option>Đang chờ</option>
                  <option>Đã xem</option>
                </select>
                <input type="date" />
              </div>
            </div>

            <div className="rd-pipeline">
              {pipelineStatuses.map((status) => (
                <div key={status.key} className="rd-column">
                  <div className="rd-column__head">
                    <span>{status.label}</span>
                    <strong>{pipelineBuckets[status.key]?.length ?? 0}</strong>
                  </div>
                  <div className="rd-column__body">
                    {pipelineBuckets[status.key]?.length ? (
                      pipelineBuckets[status.key].map((candidate) => (
                        <div key={`${candidate.name}-${status.key}`} className="rd-pill-card">
                          <p className="rd-pill-card__title">{candidate.name}</p>
                          <p className="rd-muted">{candidate.job}</p>
                          <small>{candidate.appliedAt}</small>
                        </div>
                      ))
                    ) : (
                      <p className="rd-empty">Chưa có ứng viên.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rd-table-wrapper">
              <div className="rd-table-head">
                <h3>Ứng tuyển gần đây</h3>
                <button className="rd-link">Xem tất cả</button>
              </div>
              <div className="rd-table">
                <div className="rd-table__row rd-table__row--head">
                  <span>Ứng viên</span>
                  <span>Vị trí</span>
                  <span>Trạng thái</span>
                  <span>Ngày nộp</span>
                  <span>Giai đoạn</span>
                  <span>Hành động</span>
                </div>
                {recentApplications.map((row) => (
                  <div className="rd-table__row" key={row.id}>
                    <span>{row.candidate}</span>
                    <span>{row.job}</span>
                    <span className="rd-status">{row.status}</span>
                    <span>{row.applied}</span>
                    <span>{row.stage}</span>
                    <span className="rd-row-actions">
                      <button>Xem</button>
                      <button>Chuyển bước</button>
                      <button className="danger">Từ chối</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rd-card">
            <div className="rd-card__head">
              <div>
                <h2>Tin tuyển dụng của tôi</h2>
                <p className="rd-muted">Quản lý trạng thái tin đăng và hiệu suất tiếp cận ứng viên.</p>
              </div>
              <div className="rd-tabs">
                <button className="active">Tất cả</button>
                <button>Đang hoạt động</button>
                <button>Nháp</button>
              </div>
            </div>

            <div className="rd-table rd-table--jobs">
              <div className="rd-table__row rd-table__row--head">
                <span>Vị trí</span>
                <span>Trạng thái</span>
                <span>Loại hình</span>
                <span>Địa điểm</span>
                <span>Ngày đăng</span>
                <span>Hết hạn</span>
                <span>Ứng tuyển</span>
                <span>Lượt xem</span>
                <span>Hành động</span>
              </div>
              {jobRows.map((job) => {
                const statusClass = job.status === "Đã duyệt" ? "success" : job.status === "Nháp" ? "warning" : "info"
                return (
                  <div className="rd-table__row" key={job.id}>
                    <span>{job.title}</span>
                    <span className={`rd-status ${statusClass}`}>{job.status}</span>
                    <span>{job.type}</span>
                    <span>{job.location}</span>
                    <span>{job.posted}</span>
                    <span>{job.expires}</span>
                    <span>{job.applications}</span>
                    <span>{job.views}</span>
                    <span className="rd-manage-cell">
                      <button className="rd-secondary-btn" onClick={() => navigate("/recruiter/company")}>
                        Hồ sơ công ty
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rd-grid rd-grid--two">
            <article className="rd-card">
              <div className="rd-card__head">
                <div>
                  <h2>Top ứng viên trong pipeline</h2>
                  <p className="rd-muted">Những hồ sơ nổi bật đang tương tác với công ty.</p>
                </div>
                <button className="rd-link">Xem pipeline</button>
              </div>
              <div className="rd-stack">
                {topCandidates.map((candidate) => (
                  <div className="rd-pill-card rd-pill-card--horizontal" key={candidate.name}>
                    <div>
                      <p className="rd-pill-card__title">{candidate.name}</p>
                      <p className="rd-muted">{candidate.role}</p>
                      <div className="rd-chip-row">
                        {candidate.skills.map((skill) => (
                          <span className="rd-chip" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rd-meta-block">
                      <span className={`rd-flag ${candidate.looking ? "success" : ""}`}>
                        {candidate.looking ? "Sẵn sàng đi làm" : "Không tìm việc"}
                      </span>
                      <strong>{candidate.applications} hồ sơ</strong>
                      <small>Trạng thái: {candidate.latestStatus}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rd-card">
              <div className="rd-card__head">
                <div>
                  <h2>Ứng viên đã lưu</h2>
                  <p className="rd-muted">Những hồ sơ đã lưu hoặc ứng viên lưu tin của bạn.</p>
                </div>
                <button className="rd-link">Quản lý talent pool</button>
              </div>
              <div className="rd-stack">
                {savedCandidates.map((candidate) => (
                  <div className="rd-pill-card rd-pill-card--horizontal" key={candidate.name}>
                    <div>
                      <p className="rd-pill-card__title">{candidate.name}</p>
                      <p className="rd-muted">{candidate.role}</p>
                      <div className="rd-chip-row">
                        {candidate.skills.map((skill) => (
                          <span className="rd-chip accent" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rd-meta-block">
                      <span className="rd-flag">Quan tâm: {candidate.savedJob}</span>
                      <button className="rd-secondary-btn">Xem hồ sơ</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  )
}
