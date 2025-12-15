import { useEffect, useMemo, useState } from 'react'
import Modal from '../Modal.jsx'
import { ResumeApi } from '../../services/resumeApi'
import { ApplicationService } from '../../lib/api'
import './ApplyDrawer.css'

/**
 * Drawer modal to let candidate pick/upload resume and apply to a job.
 */
export default function ApplyDrawer({ open, onClose, jobId, jobTitle, onSubmitted }) {
  const [resumes, setResumes] = useState([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [selectedResume, setSelectedResume] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const fetchResumes = async () => {
    setLoadingResumes(true)
    setError('')
    try {
      const data = await ResumeApi.getResumes()
      const list = Array.isArray(data) ? data : data?.data || []
      setResumes(list)
      const defaultResume = list.find((r) => r.is_default)
      if (defaultResume) {
        setSelectedResume(defaultResume.id)
      } else if (list.length > 0) {
        setSelectedResume(list[0].id)
      }
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách CV. Vui lòng thử lại.')
      setResumes([])
    } finally {
      setLoadingResumes(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchResumes()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await ResumeApi.uploadResume(file, {
        title: file.name,
        auto_parse: true,
        is_default: resumes.length === 0
      })
      await fetchResumes()
    } catch (err) {
      setError(err?.message || 'Tải CV thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!jobId) {
      setError('Thiếu thông tin job.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await ApplicationService.create({
        job_id: jobId,
        resume_id: selectedResume || undefined,
        metadata: note ? { note } : undefined
      })
      if (onSubmitted) onSubmitted()
      else alert('Đã gửi ứng tuyển thành công.')
      onClose?.()
    } catch (err) {
      if (err?.status === 401) {
        setError('Bạn cần đăng nhập tài khoản Người tìm việc để ứng tuyển.')
      } else if (err?.status === 403) {
        setError('Bạn không có quyền ứng tuyển. Hãy đăng nhập đúng vai trò Người tìm việc hoặc kiểm tra token.')
      } else {
        setError(err?.data?.message || err?.message || 'Không thể gửi ứng tuyển.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectedResumeObj = useMemo(
    () => resumes.find((r) => r.id === selectedResume),
    [resumes, selectedResume]
  )

  return (
    <Modal open={open} onClose={onClose} noWrapper>
      <div className="apply-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="apply-drawer__header">
          <div>
            <div className="muted small">Ứng tuyển</div>
            <h3 className="apply-drawer__title">{jobTitle || 'Công việc'}</h3>
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form className="apply-drawer__body" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-label">
              Chọn CV
              <span className="muted small">Chúng tôi sẽ gửi CV này cho nhà tuyển dụng</span>
            </div>
            {loadingResumes ? (
              <div className="muted">Đang tải CV...</div>
            ) : resumes.length === 0 ? (
              <div className="empty-box">
                <p className="muted" style={{ marginBottom: 8 }}>Bạn chưa có CV nào.</p>
                <label className="btn primary">
                  Tải CV lên
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} hidden />
                </label>
              </div>
            ) : (
              <div className="resume-grid">
                {resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`resume-card ${selectedResume === resume.id ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={resume.id}
                      checked={selectedResume === resume.id}
                      onChange={() => setSelectedResume(resume.id)}
                    />
                    <div className="resume-card__content">
                      <div className="resume-card__title">{resume.title || 'CV không tên'}</div>
                      <div className="muted small">
                        {resume.status || resume.updated_at ? `Cập nhật: ${new Date(resume.updated_at || resume.created_at).toLocaleDateString('vi-VN')}` : 'Chưa rõ'}
                      </div>
                      {resume.is_default && <span className="badge">Mặc định</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="inline-actions">
              <label className="btn ghost small">
                {uploading ? 'Đang tải...' : 'Tải CV mới'}
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} hidden disabled={uploading} />
              </label>
              <a className="muted small" href="/resumes" onClick={onClose}>Quản lý CV</a>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">Ghi chú tới nhà tuyển dụng (tuỳ chọn)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Thời gian phỏng vấn phù hợp, portfolio..."
              rows={3}
            />
          </div>

          {selectedResumeObj?.file_url && (
            <div className="muted small">
              CV được gửi: {selectedResumeObj.title || 'CV'}
            </div>
          )}

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <div className="apply-drawer__footer">
            <button type="button" className="btn" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn primary" disabled={submitting || loadingResumes || resumes.length === 0 && uploading}>
              {submitting ? 'Đang gửi...' : 'Gửi ứng tuyển'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

