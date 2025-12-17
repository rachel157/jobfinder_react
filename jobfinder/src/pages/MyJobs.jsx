import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { JobService } from '../lib/api.js'
import { Button, Card, CardBody, Badge, Input, ConfirmModal } from '../components/shared'
import '../styles/shared.css'
import './MyJobs.css'

const PAGE_SIZE = 20
const JOB_STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'draft', label: 'Nháp' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'closed', label: 'Đã đóng' }
]

const JOB_TYPE_LABELS = {
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
  contract: 'Hợp đồng'
}

const STATUS_LABELS = {
  draft: 'Nháp',
  approved: 'Đã duyệt',
  closed: 'Đã đóng'
}

const STATUS_COLORS = {
  draft: 'gray',
  approved: 'green',
  closed: 'red'
}

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '--'
  }
}

export default function MyJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'card'
  const [selectedJobs, setSelectedJobs] = useState([])
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters = {
        page: currentPage,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        search: searchQuery || undefined
      }
      const response = await JobService.myJobs(filters)
      const data = response?.data || response || []
      const pag = response?.pagination || { page: currentPage, limit: PAGE_SIZE, total: data.length, total_pages: 1 }
      
      setJobs(data)
      setPagination(pag)
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
      setError(err?.message || 'Không thể tải danh sách việc làm. Vui lòng thử lại.')
      if (err?.status === 401) {
        navigate('/login?role=recruiter&redirect=' + encodeURIComponent(window.location.pathname))
      }
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, searchQuery, navigate])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleStatusChange = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleEdit = (jobId) => {
    navigate(`/recruiter/jobs/${jobId}/manage`)
  }

  const handleDelete = async (jobId, title) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tin tuyển dụng "${title}"?`)) {
      return
    }
    try {
      await JobService.delete(jobId)
      alert('Đã xóa tin tuyển dụng thành công.')
      fetchJobs()
    } catch (err) {
      alert(err?.message || 'Không thể xóa tin tuyển dụng. Vui lòng thử lại.')
    }
  }

  const handleStatusToggle = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'closed' : 'approved'
    try {
      await JobService.updateStatus(jobId, newStatus)
      fetchJobs()
      setSelectedJobs([])
    } catch (err) {
      alert(err?.message || 'Không thể thay đổi trạng thái. Vui lòng thử lại.')
    }
  }

  const handleSelectJob = (jobId) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    )
  }

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([])
    } else {
      setSelectedJobs(jobs.map(job => job.id))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedJobs.map(id => JobService.delete(id)))
      fetchJobs()
      setSelectedJobs([])
      setShowBulkDeleteConfirm(false)
    } catch (err) {
      alert(err?.message || 'Không thể xóa một số tin tuyển dụng. Vui lòng thử lại.')
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    try {
      await Promise.all(selectedJobs.map(id => JobService.updateStatus(id, newStatus)))
      fetchJobs()
      setSelectedJobs([])
    } catch (err) {
      alert(err?.message || 'Không thể thay đổi trạng thái. Vui lòng thử lại.')
    }
  }

  return (
    <div className="section my-jobs-page">
      <div className="my-jobs-header">
        <div>
          <h1 className="my-jobs-title">Quản lý tin tuyển dụng</h1>
          <p className="my-jobs-subtitle">Quản lý và theo dõi tất cả tin tuyển dụng của bạn</p>
        </div>
        <Button 
          variant="primary"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = "/post-job"
          }}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          }
        >
          Đăng tin mới
        </Button>
      </div>

      {/* Filters and Search */}
      <Card padding="medium" className="my-jobs-filters">
        <div className="filters-row">
          <div className="search-wrapper">
            <Input
              placeholder="Tìm kiếm theo tiêu đề..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
              }
            />
          </div>
          <div className="filter-chips">
            {JOB_STATUSES.map(status => (
              <button
                key={status.value}
                className={`filter-chip ${statusFilter === status.value ? 'active' : ''}`}
                onClick={() => handleStatusChange(status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Xem dạng bảng"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="Xem dạng thẻ"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-actions-label">
              Đã chọn {selectedJobs.length} tin
            </span>
            <div className="bulk-actions-buttons">
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkStatusChange('approved')}
              >
                Mở tất cả
              </Button>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkStatusChange('closed')}
              >
                Đóng tất cả
              </Button>
              <Button 
                variant="danger" 
                size="small"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                Xóa đã chọn
              </Button>
              <Button 
                variant="ghost" 
                size="small"
                onClick={() => setSelectedJobs([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}
      </Card>

      {loading && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Đang tải...</p>
        </div>
      )}

      {error && (
        <div className="card" style={{ padding: '20px', background: '#fee', border: '1px solid #fcc' }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          <button className="btn" onClick={fetchJobs} style={{ marginTop: '12px' }}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <Card padding="large" className="empty-state-card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 className="empty-state-title">Chưa có tin tuyển dụng nào</h3>
            <p className="empty-state-description">
              Bắt đầu bằng cách đăng tin tuyển dụng đầu tiên của bạn
            </p>
            <Button 
              variant="primary"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = "/post-job"
              }}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              }
            >
              Đăng tin đầu tiên
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <div className="jobs-table-wrapper">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedJobs.length === jobs.length && jobs.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                    <th>Loại</th>
                    <th>Địa điểm</th>
                    <th>Đăng ngày</th>
                    <th>Hết hạn</th>
                    <th style={{ textAlign: 'center' }}>Ứng tuyển</th>
                    <th style={{ textAlign: 'center' }}>Lượt xem</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const location = job.locations?.name || job.location?.name || job.location_text || '--'
                    const status = job.status || 'draft'
                    const statusLabel = STATUS_LABELS[status] || status
                    const isSelected = selectedJobs.includes(job.id)
                    
                    return (
                      <tr key={job.id} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectJob(job.id)}
                          />
                        </td>
                        <td>
                          <strong>{job.title || 'Chưa có tiêu đề'}</strong>
                        </td>
                        <td>
                          <Badge 
                            variant={status === 'approved' ? 'success' : status === 'closed' ? 'danger' : 'default'}
                            size="small"
                          >
                            {statusLabel}
                          </Badge>
                        </td>
                        <td>{JOB_TYPE_LABELS[job.job_type] || job.job_type || '--'}</td>
                        <td>{location}</td>
                        <td>{formatDate(job.posted_at)}</td>
                        <td>{formatDate(job.expires_at)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563eb',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            {job._count?.applications || job.applications_count || 0}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {job._count?.job_views || job.views_count || job._count?.views || 0}
                        </td>
                        <td>
                          <div className="job-actions">
                            <Button 
                              variant="ghost" 
                              size="small"
                              onClick={() => handleEdit(job.id)}
                              icon={
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              }
                            >
                              Sửa
                            </Button>
                            {status === 'approved' && (
                              <Button 
                                variant="outline" 
                                size="small"
                                onClick={() => handleStatusToggle(job.id, status)}
                              >
                                Đóng
                              </Button>
                            )}
                            {status === 'closed' && (
                              <Button 
                                variant="outline" 
                                size="small"
                                onClick={() => handleStatusToggle(job.id, status)}
                              >
                                Mở lại
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="small"
                              onClick={() => handleDelete(job.id, job.title)}
                              icon={
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              }
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="jobs-card-grid">
              {jobs.map((job) => {
                const location = job.locations?.name || job.location?.name || job.location_text || '--'
                const status = job.status || 'draft'
                const statusLabel = STATUS_LABELS[status] || status
                const isSelected = selectedJobs.includes(job.id)
                
                return (
                  <Card 
                    key={job.id} 
                    variant="elevated" 
                    padding="medium"
                    className={`job-card ${isSelected ? 'selected' : ''}`}
                    hover
                  >
                    <div className="job-card-header">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectJob(job.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Badge 
                        variant={status === 'approved' ? 'success' : status === 'closed' ? 'danger' : 'default'}
                        size="small"
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                    <h3 className="job-card-title">{job.title || 'Chưa có tiêu đề'}</h3>
                    <div className="job-card-meta">
                      <span>💼 {JOB_TYPE_LABELS[job.job_type] || job.job_type}</span>
                      <span>📍 {location}</span>
                    </div>
                    <div className="job-card-stats">
                      <div className="job-stat">
                        <span className="stat-label">Ứng tuyển</span>
                        <button
                          onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '16px',
                            fontWeight: '600',
                            padding: 0
                          }}
                        >
                          {job._count?.applications || job.applications_count || 0}
                        </button>
                      </div>
                      <div className="job-stat">
                        <span className="stat-label">Lượt xem</span>
                        <span className="stat-value">{job._count?.job_views || job.views_count || job._count?.views || 0}</span>
                      </div>
                      <div className="job-stat">
                        <span className="stat-label">Đăng ngày</span>
                        <span className="stat-value">{formatDate(job.posted_at)}</span>
                      </div>
                    </div>
                    <div className="job-card-actions">
                      <Button 
                        variant="default" 
                        size="small"
                        onClick={() => handleEdit(job.id)}
                        icon={
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        }
                      >
                        Sửa
                      </Button>
                      {status === 'approved' && (
                        <Button 
                          variant="outline" 
                          size="small"
                          onClick={() => handleStatusToggle(job.id, status)}
                        >
                          Đóng
                        </Button>
                      )}
                      {status === 'closed' && (
                        <Button 
                          variant="outline" 
                          size="small"
                          onClick={() => handleStatusToggle(job.id, status)}
                        >
                          Mở lại
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="small"
                        onClick={() => handleDelete(job.id, job.title)}
                        icon={
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        }
                      >
                        Xóa
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination">
              <Button 
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                }
              >
                Trước
              </Button>
              <div className="pagination-info">
                Trang {currentPage} / {pagination.total_pages}
              </div>
              <Button 
                variant="outline"
                disabled={currentPage >= pagination.total_pages}
                onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
                iconPosition="right"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                }
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bulk Delete Confirmation */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ${selectedJobs.length} tin tuyển dụng đã chọn? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  )
}

