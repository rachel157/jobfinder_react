import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ApplicationService } from '../lib/api.js'
import { JobService } from '../lib/api.js'
import { Button, Card, CardBody, Badge, Input, Select, ConfirmModal } from '../components/shared'
import '../styles/shared.css'
import './ApplicationsList.css'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Đang chờ' },
  { value: 'reviewed', label: 'Đã xem' },
  { value: 'accepted', label: 'Chấp nhận' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'withdrawn', label: 'Đã rút' }
]

const STATUS_LABELS = {
  pending: 'Đang chờ',
  reviewed: 'Đã xem',
  accepted: 'Chấp nhận',
  rejected: 'Từ chối',
  withdrawn: 'Đã rút'
}

const STATUS_COLORS = {
  pending: 'default',
  reviewed: 'info',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'default'
}

const SORT_OPTIONS = [
  { value: 'applied_at', label: 'Mới nhất' },
  { value: 'name', label: 'Theo tên' },
  { value: 'rating', label: 'Theo rating' }
]

function formatDate(dateString) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '--'
  }
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

function renderRating(rating) {
  if (!rating || rating <= 0) return '--'
  const validRating = Math.min(5, Math.max(1, Math.floor(rating)))
  const filled = '★'.repeat(validRating)
  const empty = '☆'.repeat(5 - validRating)
  return filled + empty
}

export default function ApplicationsList() {
  const navigate = useNavigate()
  const { jobId } = useParams()
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('applied_at')
  const [order, setOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('table')
  const [selectedApps, setSelectedApps] = useState([])
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkAction, setBulkAction] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, total_pages: 1 })

  const fetchJob = useCallback(async () => {
    if (!jobId) return
    try {
      const response = await JobService.getManage(jobId)
      const data = response?.data || response
      setJob(data)
    } catch (err) {
      console.error('Failed to fetch job:', err)
    }
  }, [jobId])

  const fetchStats = useCallback(async () => {
    if (!jobId) return
    try {
      const response = await ApplicationService.getStats(jobId)
      const data = response?.data || response
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [jobId])

  const fetchApplications = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const filters = {
        page: currentPage,
        limit: PAGE_SIZE,
        status: (statusFilter && statusFilter.trim() !== '') ? statusFilter : undefined,
        stage: (stageFilter && stageFilter.trim() !== '') ? stageFilter : undefined,
        // search: searchQuery || undefined, // Not supported by backend yet
        sort_by: sortBy,
        order: order
      }
      const response = await ApplicationService.listByJob(jobId, filters)
      const data = response?.data || response || []
      const pag = response?.pagination || { page: currentPage, limit: PAGE_SIZE, total: data.length, total_pages: 1 }
      
      setApplications(data)
      setPagination(pag)
    } catch (err) {
      console.error('Failed to fetch applications:', err)
      console.error('Error details:', err?.data || err?.response || err)
      const errorMessage = err?.data?.message || err?.message || 'Không thể tải danh sách ứng viên. Vui lòng thử lại.'
      setError(errorMessage)
      if (err?.status === 401) {
        navigate('/login?role=recruiter&redirect=' + encodeURIComponent(window.location.pathname))
      }
    } finally {
      setLoading(false)
    }
  }, [jobId, currentPage, statusFilter, stageFilter, searchQuery, sortBy, order, navigate])

  useEffect(() => {
    fetchJob()
    fetchStats()
  }, [fetchJob, fetchStats])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleStatusFilter = (value) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleSelectApp = (appId) => {
    setSelectedApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    )
  }

  const handleSelectAll = () => {
    if (selectedApps.length === applications.length) {
      setSelectedApps([])
    } else {
      setSelectedApps(applications.map(app => app.id))
    }
  }

  const handleBulkAction = (action) => {
    setBulkAction(action)
    setShowBulkConfirm(true)
  }

  const confirmBulkAction = async () => {
    if (!bulkAction || selectedApps.length === 0) return
    
    try {
      const actionMap = {
        accept: 'accept',
        reject: 'reject',
        review: 'review'
      }
      
      await ApplicationService.bulkUpdate({
        application_ids: selectedApps,
        action: actionMap[bulkAction]
      })
      
      alert(`Đã ${bulkAction === 'accept' ? 'chấp nhận' : bulkAction === 'reject' ? 'từ chối' : 'đánh dấu đã xem'} ${selectedApps.length} ứng viên thành công.`)
      fetchApplications()
      fetchStats()
      setSelectedApps([])
      setShowBulkConfirm(false)
      setBulkAction(null)
    } catch (err) {
      alert(err?.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.')
    }
  }

  const handleViewDetail = (appId) => {
    navigate(`/recruiter/applications/${appId}`)
  }

  const statsData = stats || {
    total: 0,
    by_status: { pending: 0, reviewed: 0, accepted: 0, rejected: 0, withdrawn: 0 }
  }

  return (
    <div className="section applications-list-page">
      <div className="applications-header">
        <div>
          <div className="breadcrumb">
            <Link to="/recruiter/jobs">Tin tuyển dụng</Link>
            <span> / </span>
            {job && <Link to={`/recruiter/jobs/${jobId}/manage`}>{job.title || 'Job'}</Link>}
            <span> / </span>
            <span>Ứng viên</span>
          </div>
          <h1 className="applications-title">Quản lý ứng viên</h1>
          {job && <p className="applications-subtitle">Tin tuyển dụng: {job.title}</p>}
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate(`/recruiter/jobs/${jobId}/manage`)}
        >
          Quay lại
        </Button>
      </div>

      {/* Stats Section */}
      {stats && (
        <Card padding="medium" className="stats-card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{statsData.total || 0}</div>
              <div className="stat-label">Tổng số</div>
            </div>
            <div className="stat-item stat-pending">
              <div className="stat-value">{statsData.by_status?.pending || 0}</div>
              <div className="stat-label">Đang chờ</div>
            </div>
            <div className="stat-item stat-reviewed">
              <div className="stat-value">{statsData.by_status?.reviewed || 0}</div>
              <div className="stat-label">Đã xem</div>
            </div>
            <div className="stat-item stat-accepted">
              <div className="stat-value">{statsData.by_status?.accepted || 0}</div>
              <div className="stat-label">Chấp nhận</div>
            </div>
            <div className="stat-item stat-rejected">
              <div className="stat-value">{statsData.by_status?.rejected || 0}</div>
              <div className="stat-label">Từ chối</div>
            </div>
            <div className="stat-item stat-withdrawn">
              <div className="stat-value">{statsData.by_status?.withdrawn || 0}</div>
              <div className="stat-label">Đã rút</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters Section */}
      <Card padding="medium" className="filters-card">
        <div className="filters-row">
          <div className="search-wrapper">
            <Input
              placeholder="Tìm kiếm theo tên ứng viên..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <div className="filter-chips">
            {STATUS_OPTIONS.map(status => (
              <button
                key={status.value}
                className={`filter-chip ${statusFilter === status.value ? 'active' : ''}`}
                onClick={() => handleStatusFilter(status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
          <div className="filter-controls">
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setCurrentPage(1)
              }}
              style={{ minWidth: '150px' }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
            <button
              className={`sort-order-btn ${order === 'desc' ? 'desc' : 'asc'}`}
              onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
              title={order === 'desc' ? 'Giảm dần' : 'Tăng dần'}
            >
              {order === 'desc' ? '↓' : '↑'}
            </button>
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Xem dạng bảng"
            >
              Bảng
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="Xem dạng thẻ"
            >
              Thẻ
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApps.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-actions-label">
              Đã chọn {selectedApps.length} ứng viên
            </span>
            <div className="bulk-actions-buttons">
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkAction('review')}
              >
                Đánh dấu đã xem
              </Button>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkAction('accept')}
              >
                Chấp nhận
              </Button>
              <Button 
                variant="outline" 
                size="small"
                onClick={() => handleBulkAction('reject')}
              >
                Từ chối
              </Button>
              <Button 
                variant="ghost" 
                size="small"
                onClick={() => setSelectedApps([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}
      </Card>

      {loading && (
        <Card padding="large">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Đang tải...</p>
          </div>
        </Card>
      )}

      {error && (
        <Card padding="medium" style={{ background: '#fee', border: '1px solid #fcc' }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          <Button variant="outline" onClick={fetchApplications} style={{ marginTop: '12px' }}>
            Thử lại
          </Button>
        </Card>
      )}

      {!loading && !error && applications.length === 0 && (
        <Card padding="large" className="empty-state-card">
          <div className="empty-state">
            <h3 className="empty-state-title">Chưa có ứng viên nào</h3>
            <p className="empty-state-description">
              Chưa có ứng viên nào ứng tuyển cho tin tuyển dụng này
            </p>
          </div>
        </Card>
      )}

      {!loading && !error && applications.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <div className="applications-table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedApps.length === applications.length && applications.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Ứng viên</th>
                    <th>Trạng thái</th>
                    <th>Stage</th>
                    <th>Rating</th>
                    <th>Ngày ứng tuyển</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    // API trả về app.candidate (backend format) hoặc app.profiles (legacy)
                    const profile = app.profiles || app.candidate || app.candidate?.profile || {}
                    const name = profile.full_name || profile.display_name || profile.name || 'Chưa có tên'
                    const status = app.status || 'pending'
                    const isSelected = selectedApps.includes(app.id)
                    
                    return (
                      <tr key={app.id} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectApp(app.id)}
                          />
                        </td>
                        <td>
                          <div className="candidate-info">
                            <div className="candidate-avatar">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={name} />
                              ) : (
                                <span>{getInitials(name)}</span>
                              )}
                            </div>
                            <div>
                              <strong>{name}</strong>
                              {profile.headline && (
                                <div className="candidate-headline">{profile.headline}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge 
                            variant={STATUS_COLORS[status] || 'default'}
                            size="small"
                          >
                            {STATUS_LABELS[status] || status}
                          </Badge>
                        </td>
                        <td>
                          {app.current_stage?.stage_name || '--'}
                        </td>
                        <td>
                          {app.current_stage?.rating ? (
                            <span className="rating-display">
                              {renderRating(app.current_stage.rating)}
                            </span>
                          ) : '--'}
                        </td>
                        <td>{formatDate(app.applied_at)}</td>
                        <td>
                          <div className="application-actions">
                            <Button 
                              variant="ghost" 
                              size="small"
                              onClick={() => handleViewDetail(app.id)}
                            >
                              Xem chi tiết
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
            <div className="applications-card-grid">
              {applications.map((app) => {
                const profile = app.profiles || app.candidate || app.candidate?.profile || {}
                const name = profile.full_name || profile.display_name || profile.name || 'Chưa có tên'
                const status = app.status || 'pending'
                const isSelected = selectedApps.includes(app.id)
                
                return (
                  <Card 
                    key={app.id} 
                    variant="elevated" 
                    padding="medium"
                    className={`application-card ${isSelected ? 'selected' : ''}`}
                    hover
                  >
                    <div className="application-card-header">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectApp(app.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Badge 
                        variant={STATUS_COLORS[status] || 'default'}
                        size="small"
                      >
                        {STATUS_LABELS[status] || status}
                      </Badge>
                    </div>
                    <div className="application-card-body">
                      <div className="candidate-info">
                        <div className="candidate-avatar">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={name} />
                          ) : (
                            <span>{getInitials(name)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="candidate-name">{name}</h3>
                          {profile.headline && (
                            <p className="candidate-headline">{profile.headline}</p>
                          )}
                        </div>
                      </div>
                      <div className="application-card-meta">
                        <div className="meta-item">
                          <span className="meta-label">Stage:</span>
                          <span>{app.current_stage?.stage_name || '--'}</span>
                        </div>
                        {app.current_stage?.rating && (
                          <div className="meta-item">
                            <span className="meta-label">Rating:</span>
                            <span className="rating-display">
                              {renderRating(app.current_stage.rating)}
                            </span>
                          </div>
                        )}
                        <div className="meta-item">
                          <span className="meta-label">Ngày ứng tuyển:</span>
                          <span>{formatDate(app.applied_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="application-card-actions">
                      <Button 
                        variant="default" 
                        size="small"
                        onClick={() => handleViewDetail(app.id)}
                      >
                        Xem chi tiết
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
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {/* Bulk Action Confirmation */}
      <ConfirmModal
        isOpen={showBulkConfirm}
        onClose={() => {
          setShowBulkConfirm(false)
          setBulkAction(null)
        }}
        onConfirm={confirmBulkAction}
        title="Xác nhận thao tác"
        message={`Bạn có chắc chắn muốn ${bulkAction === 'accept' ? 'chấp nhận' : bulkAction === 'reject' ? 'từ chối' : 'đánh dấu đã xem'} ${selectedApps.length} ứng viên đã chọn?`}
        confirmText="Xác nhận"
        cancelText="Hủy"
        variant={bulkAction === 'reject' ? 'danger' : 'default'}
      />
    </div>
  )
}






