import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ResumeApi } from '../services/resumeApi'
import TemplateGallery from '../components/resumes/TemplateGallery'
import ProjectsSection from '../components/resumes/ProjectsSection'
import LanguagesSection from '../components/resumes/LanguagesSection'
import SummarySection from '../components/resumes/SummarySection'
import ReferencesSection from '../components/resumes/ReferencesSection'
import CVPreview from '../components/resumes/CVPreview'
import Modal from '../components/Modal'
import StatusBadge from '../components/resumes/StatusBadge'

export default function ResumeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('content')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saveIndicator, setSaveIndicator] = useState('')
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef(null)

  // Form state
  const [title, setTitle] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [sectionsOrder, setSectionsOrder] = useState([])
  const [projects, setProjects] = useState([])
  const [languages, setLanguages] = useState([])
  const [summary, setSummary] = useState('')
  const [references, setReferences] = useState([])
  const [isPublic, setIsPublic] = useState(false)
  const [status, setStatus] = useState('draft')

  useEffect(() => {
    if (id) loadResume()
  }, [id])

  const loadResume = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ResumeApi.getResumeById(id)
      setResume(data)
      setTitle(data.title || '')
      setSelectedTheme(data.content?.layout_settings?.theme || 'default')
      setSectionsOrder(data.content?.layout_settings?.sections_order || [])
      setProjects(data.content?.projects || [])
      setLanguages(data.content?.languages || [])
      setSummary(data.content?.summary || '')
      setReferences(data.content?.references || [])
      setIsPublic(data.is_public || false)
      setStatus(data.status || 'draft')
    } catch (err) {
      setError(err?.message || 'Không thể tải CV.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaveIndicator('')
    try {
      // Nếu là CV upload (PDF tĩnh) thì chỉ cho phép đổi tên và cài đặt
      if (resume?.source_type === 'uploaded') {
        await ResumeApi.updateResume(id, {
          title: title.trim(),
          is_public: isPublic,
          status: status,
        })
      } else {
        const updatedContent = {
          ...(resume.content || {}),
          layout_settings: {
            ...(resume.content?.layout_settings || {}),
            theme: selectedTheme,
            sections_order: sectionsOrder,
          },
          projects: projects,
          languages: languages,
          summary: summary,
          references: references,
        }

        await ResumeApi.updateResume(id, {
          title: title.trim(),
          content: updatedContent,
          layout_settings: {
            theme: selectedTheme,
            sections_order: sectionsOrder,
          },
          is_public: isPublic,
          status: status,
        })
      }
      await loadResume()
      setSaveIndicator('Đã lưu thành công!')
      setTimeout(() => setSaveIndicator(''), 3000)
    } catch (err) {
      setError(err?.message || 'Không thể lưu CV.')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async () => {
    try {
      await ResumeApi.setDefaultResume(id)
      await loadResume()
      setSaveIndicator('Đã đặt CV làm mặc định.')
      setTimeout(() => setSaveIndicator(''), 3000)
    } catch (err) {
      alert(err?.message || 'Không thể đặt CV làm mặc định.')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Bạn chắc chắn muốn xóa CV này? Hành động này không thể hoàn tác.')) return
    try {
      await ResumeApi.deleteResume(id)
      navigate('/resumes')
    } catch (err) {
      alert(err?.message || 'Không thể xóa CV.')
    }
  }

  const handlePreview = async () => {
    // Đảm bảo resume data đã được load
    if (!resume) {
      await loadResume()
    }
    setPreviewOpen(true)
  }

  // Map resume content to CVPreview format
  const getProfileDataForPreview = () => {
    // Always return a valid object structure
    const defaultData = {
      sections: {
        personal_info: { data: {} },
        skills: { items: [] },
        experiences: { items: [] },
        educations: { items: [] },
        certifications: { items: [] },
        awards: { items: [] }
      }
    }
    
    if (!resume || !resume.content) {
      return defaultData
    }
    
    const content = resume.content
    
    // Nếu content đã có structure sections (từ API getProfileData)
    if (content && content.sections) {
      return {
        sections: {
          personal_info: content.sections.personal_info || defaultData.sections.personal_info,
          skills: content.sections.skills || defaultData.sections.skills,
          experiences: content.sections.experiences || defaultData.sections.experiences,
          educations: content.sections.educations || defaultData.sections.educations,
          certifications: content.sections.certifications || defaultData.sections.certifications,
          awards: content.sections.awards || defaultData.sections.awards
        }
      }
    }
    
    // Nếu content là flat structure (từ createResume)
    return {
      sections: {
        personal_info: {
          data: content.personal_info || {}
        },
        skills: {
          items: Array.isArray(content.skills) ? content.skills : []
        },
        experiences: {
          items: Array.isArray(content.experiences) ? content.experiences : []
        },
        educations: {
          items: Array.isArray(content.educations) ? content.educations : []
        },
        certifications: {
          items: Array.isArray(content.certifications) ? content.certifications : []
        },
        awards: {
          items: Array.isArray(content.awards) ? content.awards : []
        }
      }
    }
  }

  const getAdditionalDataForPreview = () => {
    if (!resume) return {}
    
    const content = resume.content || {}
    return {
      projects: content.projects || [],
      languages: content.languages || [],
      summary: content.summary || '',
      references: content.references || []
    }
  }

  // Helper function để extract HTML đầy đủ từ DOM element
  const getCompleteHTML = async (element, title) => {
    if (!element) {
      console.error('❌ getCompleteHTML: element is null')
      return null
    }
    
    console.log('✅ getCompleteHTML: element found', {
      className: element.className,
      tagName: element.tagName,
      innerHTMLLength: element.innerHTML?.length || 0
    })
    
    // Clone element để không ảnh hưởng DOM hiện tại
    const clone = element.cloneNode(true)
    
    // 1. Convert images to base64 (bao gồm cả absolute URLs từ S3/CDN)
    const images = clone.querySelectorAll('img')
    await Promise.all(
      Array.from(images).map(async (img) => {
        // Convert tất cả images (bao gồm cả http/https URLs) sang base64
        if (img.src && !img.src.startsWith('data:')) {
          try {
            // Fetch image với credentials nếu cần (cho S3 với CORS)
            const response = await fetch(img.src, {
              mode: 'cors',
              credentials: 'include'
            })
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status}`)
            }
            
            const blob = await response.blob()
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
            img.src = base64
          } catch (err) {
            console.warn('Failed to convert image to base64:', err, img.src)
            // Nếu không convert được, giữ nguyên URL (backend có thể xử lý)
            // Hoặc có thể dùng placeholder nếu cần
          }
        }
      })
    )
    
    // 2. Get CSS từ style tags trong clone
    let allCSS = ''
    const styleTags = clone.querySelectorAll('style')
    styleTags.forEach((style) => {
      allCSS += style.textContent + '\n'
    })
    
    // 3. Remove style tags khỏi clone (đã extract CSS rồi)
    styleTags.forEach((tag) => tag.remove())
    
    // 4. Build complete HTML document với đầy đủ CSS và fonts
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'CV'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background: white;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    ${allCSS}
  </style>
</head>
<body>
  ${clone.innerHTML}
</body>
</html>`
  }

  const handleExport = async (format = 'pdf') => {
    if (exporting) return // Prevent multiple clicks
    
    setExporting(true)
    try {
      let htmlContent = null
      
      // Đảm bảo preview được mở để có thể lấy HTML
      if (!previewOpen) {
        console.log('📋 Mở preview để extract HTML...')
        setPreviewOpen(true)
        // Đợi DOM render xong (tăng thời gian đợi)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Đợi thêm một chút để đảm bảo template đã render hoàn toàn
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Lấy HTML từ preview
      if (previewRef.current) {
        console.log('🔍 Đang tìm template element trong preview...')
        
        // Tìm element chứa template - thử nhiều selector
        let templateElement = previewRef.current.querySelector('.cv-template')
        
        // Nếu không tìm thấy, thử tìm trong các template variants
        if (!templateElement) {
          console.log('⚠️ Không tìm thấy .cv-template, thử các variant...')
          templateElement = previewRef.current.querySelector('.cv-template--professional') ||
                           previewRef.current.querySelector('.cv-template--timeline') ||
                           previewRef.current.querySelector('.cv-template--compact')
        }
        
        // Nếu vẫn không tìm thấy, thử tìm trong preview content
        if (!templateElement) {
          console.log('⚠️ Không tìm thấy template variants, thử tìm trong preview content...')
          const previewContent = previewRef.current.querySelector('.cv-preview__content')
          if (previewContent) {
            templateElement = previewContent.querySelector('.cv-template') ||
                             previewContent.querySelector('.cv-template--professional') ||
                             previewContent.querySelector('.cv-template--timeline') ||
                             previewContent.querySelector('.cv-template--compact')
          }
        }
        
        // Nếu vẫn không tìm thấy, lấy toàn bộ preview content (fallback)
        if (!templateElement) {
          console.warn('⚠️ Không tìm thấy .cv-template, sử dụng toàn bộ preview content')
          templateElement = previewRef.current.querySelector('.cv-preview__content') ||
                           previewRef.current.querySelector('.cv-preview') ||
                           previewRef.current
        }
        
        if (templateElement) {
          console.log('✅ Tìm thấy template element:', {
            className: templateElement.className,
            tagName: templateElement.tagName
          })
          htmlContent = await getCompleteHTML(templateElement, title)
          
          if (htmlContent) {
            console.log('✅ HTML extracted successfully, length:', htmlContent.length)
          } else {
            console.error('❌ HTML extraction failed')
          }
        } else {
          console.error('❌ Không tìm thấy template element trong preview')
        }
      } else {
        console.error('❌ previewRef.current is null')
      }
      
      // Nếu không lấy được HTML, cảnh báo nhưng vẫn tiếp tục
      if (!htmlContent) {
        console.warn('⚠️ Không lấy được HTML từ preview, backend sẽ generate từ template')
        alert('Không thể lấy HTML từ preview. PDF sẽ được tạo từ template backend.')
      }
      
      // Map theme từ frontend sang backend format
      const themeMap = {
        'professional': 'professional',
        'timeline': 'modern',
        'compact': 'minimal',
        'default': 'modern'
      }
      const backendTheme = themeMap[selectedTheme] || 'modern'
      
      console.log('📤 Gửi request export với:', {
        hasHtml: !!htmlContent,
        htmlLength: htmlContent?.length || 0,
        template: backendTheme,
        format
      })
      
      // Gửi request với HTML từ frontend (nếu có) hoặc để backend generate
      const result = await ResumeApi.exportResume(id, {
        template: backendTheme,
        format: format,
        html: htmlContent // Gửi HTML từ frontend template
      })
      
      if (format === 'html') {
        const blob = new Blob([result.content || htmlContent || ''], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title || 'resume'}.html`
        a.click()
        URL.revokeObjectURL(url)
        setSaveIndicator('Đã xuất file HTML thành công!')
        setTimeout(() => setSaveIndicator(''), 3000)
      } else {
        if (result.url || result.data?.url) {
          const pdfUrl = result.url || result.data?.url
          
          try {
            // Fetch file từ S3 để download
            const response = await fetch(pdfUrl, {
              mode: 'cors',
              credentials: 'omit'
            })
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            
            // Tạo link download từ blob URL
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = `${title || 'resume'}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            
            // Cleanup blob URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
            
            setSaveIndicator('Đã xuất file PDF thành công!')
            setTimeout(() => setSaveIndicator(''), 3000)
          } catch (err) {
            console.error('Download error:', err)
            // Fallback: mở trong tab mới nếu fetch thất bại
            window.open(pdfUrl, '_blank')
            setSaveIndicator('Đã mở PDF trong tab mới!')
            setTimeout(() => setSaveIndicator(''), 3000)
          }
        } else {
          alert('Đã tạo file PDF. Vui lòng kiểm tra email hoặc tải xuống từ link.')
        }
      }
    } catch (err) {
      console.error('Export error:', err)
      alert(err?.message || 'Không thể export CV. Vui lòng thử lại.')
      setError(err?.message || 'Không thể export CV.')
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = async () => {
    try {
      // Lấy pre-signed URL từ backend
      const { url, filename } = await ResumeApi.downloadResumeFile(id)
      
      // Tạo link download trực tiếp từ pre-signed URL
      // Không fetch để tránh CORS error
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `${title || 'resume'}.pdf`
      a.target = '_blank' // Mở trong tab mới nếu download không hoạt động
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert(err?.message || 'Không thể tải file CV.')
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="card">
          <div className="muted" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            Đang tải CV...
          </div>
        </div>
      </section>
    )
  }

  if (error && !resume) {
    return (
      <section className="section">
        <div className="card">
          <div className="error-banner">{error}</div>
          <button className="btn" onClick={() => navigate('/resumes')}>
            Quay lại danh sách
          </button>
        </div>
      </section>
    )
  }

  // Phân biệt CV upload (PDF) và CV tạo từ profile/builder
  const isFileResume = resume?.source_type === 'uploaded' && !!resume?.file_url

  return (
    <section className="section resume-detail-page">
      {/* Sticky Header */}
      <div className="resume-detail-header">
        <div className="resume-detail-header__content">
          <div className="resume-detail-header__left">
            <Link to="/resumes" className="resume-detail-header__back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Quay lại
            </Link>
            <div className="resume-detail-header__title-group">
              <h1 className="resume-detail-header__title">{resume?.title || 'CV'}</h1>
              <div className="resume-detail-header__badges">
                {resume?.is_default && (
                  <span className="resume-detail-header__badge resume-detail-header__badge--default">
                    Mặc định
                  </span>
                )}
                {resume?.is_public && (
                  <span className="resume-detail-header__badge resume-detail-header__badge--public">
                    Công khai
                  </span>
                )}
                <StatusBadge status={resume?.status} />
              </div>
            </div>
          </div>
          <div className="resume-detail-header__actions">
            <button
              className="btn btn--icon"
              onClick={handlePreview}
              title="Preview CV"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
            </button>
            {!isFileResume && (
              <button
                className={`btn btn--icon ${exporting ? 'btn--loading' : ''}`}
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                title={exporting ? 'Đang xuất PDF...' : 'Xuất PDF'}
              >
                {exporting ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="30" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                )}
              </button>
            )}
            {resume?.file_url && (
              <button
                className="btn btn--icon"
                onClick={handleDownload}
                title="Download file"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
            {!resume?.is_default && (
              <button
                className="btn btn--icon"
                onClick={handleSetDefault}
                title="Đặt làm mặc định"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            )}
            <button
              className="btn btn--icon btn--danger"
              onClick={handleDelete}
              title="Xóa CV"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Save Indicator */}
      {saveIndicator && (
        <div className="save-indicator">
          {saveIndicator}
        </div>
      )}

      {/* Main Content */}
      <div className="card resume-detail-card">
        {error && (
          <div className="error-banner resume-detail-banner">
            {error}
          </div>
        )}

        {/* Modern Tabs */}
        <div className="resume-detail-tabs">
          <button
            type="button"
            className={`resume-detail-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <span className="resume-detail-tab__label">Nội dung</span>
            {activeTab === 'content' && <div className="resume-detail-tab__indicator" />}
          </button>
          <button
            type="button"
            className={`resume-detail-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="resume-detail-tab__label">Cài đặt</span>
            {activeTab === 'settings' && <div className="resume-detail-tab__indicator" />}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'content' && (
          <div className="resume-detail-content">
            {/* Title Section */}
            <div className="resume-detail-section">
              <div className="resume-detail-section__header">
                <div>
                  <h3 className="resume-detail-section__title">Thông tin cơ bản</h3>
                  <p className="resume-detail-section__description muted small">
                    Tên CV và các thông tin cơ bản
                  </p>
                </div>
              </div>
              <div className="resume-detail-section__body">
                <div className="resume-create-field">
                  <label className="resume-create-field__label">
                    Tên CV <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="resume-create-field__input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Nếu là CV upload (PDF tĩnh), không hiển thị builder chi tiết */}
            {isFileResume ? (
              <div className="resume-detail-section">
                <div className="resume-detail-section__header">
                  <div>
                    <h3 className="resume-detail-section__title">CV dạng file PDF</h3>
                    <p className="resume-detail-section__description muted small">
                      CV này được tải lên từ file. Bạn chỉ có thể đổi tên và cài đặt hiển thị. Nếu muốn chỉnh sửa nội dung, hãy tạo CV mới từ hồ sơ.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Template Section */}
                <div className="resume-detail-section">
                  <div className="resume-detail-section__header">
                    <div>
                      <h3 className="resume-detail-section__title">Template</h3>
                      <p className="resume-detail-section__description muted small">
                        Chọn template cho CV của bạn
                      </p>
                    </div>
                  </div>
                  <div className="resume-detail-section__body">
                    <TemplateGallery
                      selectedTheme={selectedTheme}
                      onSelectTheme={setSelectedTheme}
                    />
                  </div>
                </div>

                {/* Additional Info Sections - align style with create page */}
                <div className="additional-info-grid">
              <div className="additional-info-card">
                <div className="additional-info-card__header">
                  <div className="additional-info-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div className="additional-info-card__title-group">
                    <h3 className="additional-info-card__title">Dự án</h3>
                    <p className="additional-info-card__subtitle muted small">Thêm các dự án nổi bật vào CV</p>
                  </div>
                </div>
                <div className="additional-info-card__body">
                  <ProjectsSection projects={projects} onChange={setProjects} />
                </div>
              </div>

              <div className="additional-info-card">
                <div className="additional-info-card__header">
                  <div className="additional-info-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div className="additional-info-card__title-group">
                    <h3 className="additional-info-card__title">Tóm tắt / Mục tiêu</h3>
                    <p className="additional-info-card__subtitle muted small">Viết về bản thân và mục tiêu nghề nghiệp</p>
                  </div>
                </div>
                <div className="additional-info-card__body">
                  <SummarySection summary={summary} onChange={setSummary} />
                </div>
              </div>

              <div className="additional-info-card">
                <div className="additional-info-card__header">
                  <div className="additional-info-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div className="additional-info-card__title-group">
                    <h3 className="additional-info-card__title">Ngôn ngữ</h3>
                    <p className="additional-info-card__subtitle muted small">Thêm các ngôn ngữ bạn thành thạo</p>
                  </div>
                </div>
                <div className="additional-info-card__body">
                  <LanguagesSection languages={languages} onChange={setLanguages} />
                </div>
              </div>

              <div className="additional-info-card">
                <div className="additional-info-card__header">
                  <div className="additional-info-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="additional-info-card__title-group">
                    <h3 className="additional-info-card__title">Người tham khảo</h3>
                    <p className="additional-info-card__subtitle muted small">Thêm thông tin người tham khảo</p>
                  </div>
                </div>
                <div className="additional-info-card__body">
                  <ReferencesSection references={references} onChange={setReferences} />
                </div>
            </div>
            </div>
            </>
            )}
            {/* Actions */}
            <div className="resume-detail-form__actions">
              <button type="button" className="btn" onClick={() => navigate('/resumes')}>
                Hủy
              </button>
              <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="resume-detail-content">
            <div className="resume-detail-section">
              <div className="resume-detail-section__header">
                <div>
                  <h3 className="resume-detail-section__title">Cài đặt CV</h3>
                  <p className="resume-detail-section__description muted small">
                    Quản lý trạng thái và quyền riêng tư
                  </p>
                </div>
              </div>
              <div className="resume-detail-section__body">
                <div className="resume-detail-settings">
                  <label className="resume-detail-checkbox">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <div className="resume-detail-checkbox__content">
                      <div className="resume-detail-checkbox__title">Công khai CV</div>
                      <div className="resume-detail-checkbox__description muted small">
                        Cho phép nhà tuyển dụng xem CV công khai
                      </div>
                    </div>
                  </label>
                  <label className="field">
                    <span>Trạng thái</span>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="draft">Nháp</option>
                      <option value="active">Hoạt động</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="resume-detail-form__actions">
              <button type="button" className="btn" onClick={() => navigate('/resumes')}>
                Hủy
              </button>
              <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} noWrapper={true}>
        <div className="resume-preview-modal">
          <div className="resume-preview-modal__header">
            <h3 style={{ margin: 0 }}>Preview CV</h3>
            <div className="resume-preview-modal__actions">
              {!isFileResume && (
                <button 
                  className={`btn btn--icon ${exporting ? 'btn--loading' : ''}`}
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  title={exporting ? 'Đang xuất PDF...' : 'Xuất PDF'}
                >
                  {exporting ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner">
                      <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="30" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  )}
                </button>
              )}
              <button className="btn btn--icon" onClick={() => setPreviewOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div className="resume-preview-modal__body">
            {resume ? (
              isFileResume && resume.file_url ? (
                <iframe
                  src={resume.file_url}
                  title={resume.title || 'CV'}
                  style={{ width: '100%', height: '80vh', border: 'none', borderRadius: '12px' }}
                />
              ) : (
                (() => {
                  const profileData = getProfileDataForPreview()
                  const additionalData = getAdditionalDataForPreview()
                  const previewTheme = selectedTheme || resume.content?.layout_settings?.theme || 'professional'
                  
                  if (!profileData || !profileData.sections) {
                    return (
                      <div className="resume-preview-loading">
                        <p className="muted">Không có dữ liệu để preview</p>
                      </div>
                    )
                  }
                  
                  return (
                    <CVPreview
                      ref={previewRef}
                      profileData={profileData}
                      theme={previewTheme}
                      title={title || resume.title}
                      onClose={() => setPreviewOpen(false)}
                      hideHeader={true}
                      additionalData={additionalData}
                    />
                  )
                })()
              )
            ) : (
              <div className="resume-preview-loading">
                <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px' }} />
                <p className="muted">Đang tải dữ liệu...</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </section>
  )
}
