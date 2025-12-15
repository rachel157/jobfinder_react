import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { JobService, SkillService, LocationService, TagService } from '../lib/api.js'
import { companyApi } from '../services/companyApi'
import { ProgressStepper } from '../components/jobs/ProgressStepper'
import { Button, Card, CardBody, Badge, Input, Textarea, Select, Modal } from '../components/shared'
import '../styles/shared.css'
import './PostJob.css'


const JOB_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'contract', label: 'Hợp đồng' }
]

const REQUIREMENT_TYPE_OPTIONS = [
  { value: 'education', label: 'Học vấn' },
  { value: 'experience', label: 'Kinh nghiệm' },
  { value: 'skill', label: 'Kỹ năng' },
  { value: 'certification', label: 'Chứng chỉ' },
  { value: 'language', label: 'Ngoại ngữ' },
  { value: 'other', label: 'Khác' }
]

const BENEFIT_TYPE_OPTIONS = [
  { value: 'salary', label: 'Lương thưởng' },
  { value: 'insurance', label: 'Bảo hiểm' },
  { value: 'bonus', label: 'Thưởng' },
  { value: 'training', label: 'Đào tạo' },
  { value: 'vacation', label: 'Nghỉ phép' },
  { value: 'equipment', label: 'Trang thiết bị' },
  { value: 'other', label: 'Khác' }
]

const SHIFT_TYPE_OPTIONS = [
  { value: 'morning', label: 'Ca sáng' },
  { value: 'afternoon', label: 'Ca chiều' },
  { value: 'night', label: 'Ca đêm' },
  { value: 'flexible', label: 'Linh hoạt' }
]

export default function PostJob() {
  console.log('PostJob component rendered')
  const navigate = useNavigate()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [activeTab, setActiveTab] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  
  // Dropdown data
  const [skills, setSkills] = useState([])
  const [tags, setTags] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedSkillsData, setSelectedSkillsData] = useState([]) // Store full skill objects
  const [selectedTagsData, setSelectedTagsData] = useState([]) // Store full tag objects
  const [skillSearch, setSkillSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null) // Store selected location object
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    company_id: '',
    location_id: '',
    salary_min: '',
    salary_max: '',
    currency: 'VND',
    job_type: 'full_time',
    experience_level: '',
    expires_at: '',
    requirements: [],
    benefits: [],
    skill_ids: [],
    tag_ids: [],
    work_arrangements: {
      is_remote_allowed: false,
      remote_percentage: 0,
      flexible_hours: false,
      travel_requirement: '',
      overtime_expected: false,
      shift_type: ''
    }
  })
  
  // Progress stepper steps
  const steps = [
    { title: 'Thông tin cơ bản', description: 'Tiêu đề, mô tả, công ty' },
    { title: 'Yêu cầu', description: 'Yêu cầu công việc' },
    { title: 'Phúc lợi', description: 'Phúc lợi và đãi ngộ' },
    { title: 'Kỹ năng', description: 'Kỹ năng và tags' },
    { title: 'Điều kiện', description: 'Điều kiện làm việc' }
  ]
  
  const getCurrentStep = () => {
    const tabOrder = ['basic', 'requirements', 'benefits', 'skills', 'work']
    return tabOrder.indexOf(activeTab)
  }
  
  // Load draft on mount
  useEffect(() => {
    const autoSaveKey = 'postJob_draft'
    const saved = localStorage.getItem(autoSaveKey)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.form && (draft.form.title || draft.form.description)) {
          if (confirm('Bạn có bản nháp chưa lưu. Bạn có muốn tiếp tục?')) {
            setForm(draft.form)
            setLastSaved(new Date(draft.timestamp))
          } else {
            localStorage.removeItem(autoSaveKey)
          }
        }
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])
  
  // Auto-save functionality
  useEffect(() => {
    const autoSaveKey = 'postJob_draft'
    const autoSaveInterval = setInterval(() => {
      if (form.title || form.description) {
        localStorage.setItem(autoSaveKey, JSON.stringify({
          form,
          timestamp: new Date().toISOString()
        }))
        setLastSaved(new Date())
      }
    }, 30000) // Auto-save every 30 seconds
    
    return () => clearInterval(autoSaveInterval)
  }, [form])
  
  // Debug: Log component mount
  useEffect(() => {
    console.log('PostJob component mounted')
    return () => {
      console.log('PostJob component unmounted')
    }
  }, [])

  // Load company on mount
  useEffect(() => {
    let mounted = true
    let timeoutId = null
    let fetchCompleted = false
    
    const fetchCompany = async () => {
      try {
        console.log('Fetching company data...')
        const companyData = await companyApi.getMyCompany()
        console.log('Company data received:', companyData)
        
        fetchCompleted = true
        
        // Clear timeout if data is received successfully
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (!mounted) return
        console.log('Company verification status:', companyData?.is_verified)
        setCompany(companyData)
        setForm(prev => ({ ...prev, company_id: companyData?.id || '' }))
        setLoading(false)
        setError(null) // Clear any previous errors
        
        // FAKE: Bỏ qua check verified - cho phép đăng tin không cần verify
        // // Check if company is verified
        // if (companyData && companyData.is_verified === false) {
        //   setError('Công ty của bạn chưa được xác minh. Vui lòng liên hệ quản trị viên để xác minh công ty trước khi đăng tin tuyển dụng.')
        // } else if (companyData && companyData.is_verified === true) {
        //   console.log('Company is verified, can post jobs')
        // }
      } catch (err) {
        console.error('Failed to fetch company:', err)
        
        fetchCompleted = true
        
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (!mounted) return
        setLoading(false)
        if (err?.status === 404) {
          setError('Bạn chưa có công ty. Vui lòng tạo công ty trước.')
        } else {
          setError(err?.message || 'Không thể tải thông tin công ty.')
        }
      }
    }
    
    // Add timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      // Only show timeout error if fetch hasn't completed
      if (mounted && !fetchCompleted) {
        console.warn('Company fetch timeout, setting loading to false')
        setLoading(false)
        setError('Không thể tải thông tin công ty. Vui lòng thử lại.')
      }
    }, 10000) // 10 second timeout
    
    fetchCompany()
    
    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  // Store initial skills and tags separately
  const [initialSkills, setInitialSkills] = useState([])
  const [initialTags, setInitialTags] = useState([])

  // Load initial skills
  useEffect(() => {
    const fetchInitialSkills = async () => {
      try {
        const response = await SkillService.search({ limit: 50 })
        const data = response.data || []
        setInitialSkills(data)
        setSkills(data) // Set initial skills
      } catch (err) {
        console.error('Failed to fetch skills:', err)
      }
    }
    fetchInitialSkills()
  }, [])

  // Load initial tags
  useEffect(() => {
    const fetchInitialTags = async () => {
      try {
        const response = await TagService.list({ limit: 50 })
        const data = response.data || []
        setInitialTags(data)
        setTags(data) // Set initial tags
      } catch (err) {
        console.error('Failed to fetch tags:', err)
      }
    }
    fetchInitialTags()
  }, [])

  // Debounced search for skills
  useEffect(() => {
    if (!skillSearch.trim()) {
      // When search is empty, show initial skills
      setSkills(initialSkills)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const response = await SkillService.search({ search: skillSearch, limit: 20 })
        setSkills(response.data || [])
      } catch (err) {
        console.error('Failed to search skills:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [skillSearch, initialSkills])

  // Debounced search for tags
  useEffect(() => {
    if (!tagSearch.trim()) {
      // When search is empty, show initial tags
      setTags(initialTags)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const response = await TagService.list({ search: tagSearch, limit: 20 })
        setTags(response.data || [])
      } catch (err) {
        console.error('Failed to search tags:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [tagSearch, initialTags])

  // Store initial locations separately
  const [initialLocations, setInitialLocations] = useState([])

  // Load initial locations
  useEffect(() => {
    const fetchInitialLocations = async () => {
      try {
        const response = await LocationService.list({ limit: 50 })
        const data = response.data || []
        setInitialLocations(data)
        setLocations(data) // Set initial locations
      } catch (err) {
        console.error('Failed to fetch locations:', err)
      }
    }
    fetchInitialLocations()
  }, [])

  // Debounced search for locations
  useEffect(() => {
    if (!locationSearch.trim()) {
      // When search is empty, show initial locations
      setLocations(initialLocations)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const response = await LocationService.list({ search: locationSearch, limit: 20 })
        setLocations(response.data || [])
      } catch (err) {
        console.error('Failed to search locations:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [locationSearch, initialLocations])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('work_arrangements.')) {
      const field = name.replace('work_arrangements.', '')
      setForm(prev => ({
        ...prev,
        work_arrangements: {
          ...prev.work_arrangements,
          [field]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Requirements handlers
  const addRequirement = () => {
    setForm(prev => ({
      ...prev,
      requirements: [...prev.requirements, {
        requirement_type: '',
        title: '',
        description: '',
        is_required: true,
        level: '',
        years_experience: ''
      }]
    }))
  }

  const removeRequirement = (index) => {
    setForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const updateRequirement = (index, field, value) => {
    setForm(prev => {
      const newRequirements = [...prev.requirements]
      newRequirements[index] = { ...newRequirements[index], [field]: value }
      return { ...prev, requirements: newRequirements }
    })
  }

  // Benefits handlers
  const addBenefit = () => {
    setForm(prev => ({
      ...prev,
      benefits: [...prev.benefits, {
        benefit_type: '',
        title: '',
        description: '',
        value_amount: '',
        value_currency: 'VND'
      }]
    }))
  }

  const removeBenefit = (index) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }))
  }

  const updateBenefit = (index, field, value) => {
    setForm(prev => {
      const newBenefits = [...prev.benefits]
      newBenefits[index] = { ...newBenefits[index], [field]: value }
      return { ...prev, benefits: newBenefits }
    })
  }

  // Skills handlers
  const addSkill = (skill) => {
    if (!form.skill_ids.includes(skill.id)) {
      setForm(prev => ({
        ...prev,
        skill_ids: [...prev.skill_ids, skill.id]
      }))
      setSelectedSkillsData(prev => [...prev, skill])
    }
    setSkillSearch('')
    setShowSkillDropdown(false)
  }

  const removeSkill = (skillId) => {
    setForm(prev => ({
      ...prev,
      skill_ids: prev.skill_ids.filter(id => id !== skillId)
    }))
    setSelectedSkillsData(prev => prev.filter(s => s.id !== skillId))
  }

  // Tags handlers
  const addTag = (tag) => {
    if (!form.tag_ids.includes(tag.id)) {
      setForm(prev => ({
        ...prev,
        tag_ids: [...prev.tag_ids, tag.id]
      }))
      setSelectedTagsData(prev => [...prev, tag])
    }
    setTagSearch('')
    setShowTagDropdown(false)
  }

  const removeTag = (tagId) => {
    setForm(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.filter(id => id !== tagId)
    }))
    setSelectedTagsData(prev => prev.filter(t => t.id !== tagId))
  }

  // Validation
  const validateForm = () => {
    const errors = {}
    
    if (!form.title || form.title.trim().length < 10) {
      errors.title = 'Tiêu đề phải có ít nhất 10 ký tự'
    }
    if (!form.description || form.description.trim().length < 50) {
      errors.description = 'Mô tả phải có ít nhất 50 ký tự'
    }
    if (!form.company_id) {
      errors.company_id = 'Vui lòng chọn công ty'
    }
    
    // Salary validation
    if (form.salary_min && form.salary_max) {
      const min = parseInt(form.salary_min, 10)
      const max = parseInt(form.salary_max, 10)
      if (!isNaN(min) && !isNaN(max) && min > max) {
        errors.salary = 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu'
      }
    }
    
    // Requirements validation
    form.requirements.forEach((req, index) => {
      if (req.title?.trim() && !req.requirement_type) {
        errors[`requirements.${index}.requirement_type`] = 'Vui lòng chọn loại yêu cầu'
      }
      if (req.requirement_type && !req.title?.trim()) {
        errors[`requirements.${index}.title`] = 'Tiêu đề yêu cầu không được để trống'
      }
    })
    
    // Benefits validation
    form.benefits.forEach((ben, index) => {
      if (ben.title?.trim() && !ben.benefit_type) {
        errors[`benefits.${index}.benefit_type`] = 'Vui lòng chọn loại phúc lợi'
      }
      if (ben.benefit_type && !ben.title?.trim()) {
        errors[`benefits.${index}.title`] = 'Tiêu đề phúc lợi không được để trống'
      }
    })
    
    // Remote percentage validation
    if (form.work_arrangements.is_remote_allowed) {
      const percentage = parseInt(form.work_arrangements.remote_percentage, 10)
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        errors.remote_percentage = 'Phần trăm làm việc từ xa phải từ 0-100'
      }
    }
    
    return errors
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Vui lòng kiểm tra lại các trường đã nhập.')
      return
    }

    // FAKE: Bỏ qua check verified - cho phép đăng tin không cần verify
    // // Check company verification before submitting
    // if (company && company.is_verified === false) {
    //   setError('Công ty của bạn chưa được xác minh. Vui lòng liên hệ quản trị viên để xác minh công ty trước khi đăng tin tuyển dụng.')
    //   return
    // }

    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        company_id: form.company_id,
        location_id: form.location_id || null,
        salary_range: (form.salary_min && form.salary_max) ? {
          min: parseInt(form.salary_min, 10),
          max: parseInt(form.salary_max, 10),
          currency: form.currency || 'VND'
        } : undefined,
        job_type: form.job_type,
        experience_level: form.experience_level ? parseInt(form.experience_level, 10) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        requirements: form.requirements.filter(req => req.title?.trim() && req.requirement_type).length > 0 
          ? form.requirements.filter(req => req.title?.trim() && req.requirement_type).map(req => ({
              requirement_type: req.requirement_type,
              title: req.title.trim(),
              description: req.description?.trim() || undefined,
              is_required: req.is_required !== false,
              level: req.level?.trim() || undefined,
              years_experience: req.years_experience ? parseInt(req.years_experience, 10) : undefined
            }))
          : undefined,
        benefits: form.benefits.filter(ben => ben.title?.trim() && ben.benefit_type).length > 0
          ? form.benefits.filter(ben => ben.title?.trim() && ben.benefit_type).map(ben => ({
              benefit_type: ben.benefit_type,
              title: ben.title.trim(),
              description: ben.description?.trim() || undefined,
              value_amount: ben.value_amount?.trim() || undefined,
              value_currency: ben.value_currency || 'VND'
            }))
          : undefined,
        skill_ids: form.skill_ids.length > 0 ? form.skill_ids : undefined,
        tag_ids: form.tag_ids.length > 0 ? form.tag_ids : undefined,
        work_arrangements: form.work_arrangements.is_remote_allowed || 
                          form.work_arrangements.flexible_hours ||
                          form.work_arrangements.travel_requirement?.trim() ||
                          form.work_arrangements.overtime_expected ||
                          form.work_arrangements.shift_type
          ? {
              is_remote_allowed: form.work_arrangements.is_remote_allowed || false,
              remote_percentage: form.work_arrangements.is_remote_allowed 
                ? parseInt(form.work_arrangements.remote_percentage, 10) || 0 
                : 0,
              flexible_hours: form.work_arrangements.flexible_hours || false,
              travel_requirement: form.work_arrangements.travel_requirement?.trim() || undefined,
              overtime_expected: form.work_arrangements.overtime_expected || false,
              shift_type: form.work_arrangements.shift_type || undefined
            }
          : undefined
      }

      const response = await JobService.create(payload)
      // Clear draft after successful submission
      localStorage.removeItem('postJob_draft')
      setLastSaved(null)
      alert('Đã tạo tin tuyển dụng thành công! Tin sẽ được duyệt trước khi hiển thị.')
      const jobId = response?.data?.id
      if (jobId) {
        navigate(`/recruiter/jobs/${jobId}/manage`)
      } else {
        navigate('/recruiter/jobs')
      }
    } catch (err) {
      console.error('Failed to create job:', err)
      if (err?.data?.errors) {
        const errorMap = {}
        err.data.errors.forEach(e => {
          errorMap[e.path] = e.message
        })
        setFieldErrors(errorMap)
      }
      // FAKE: Bỏ qua check verified - không hiển thị lỗi về verified
      // // Handle specific error messages
      // if (err?.status === 403 && (err?.message?.includes('verified') || err?.message?.includes('xác minh'))) {
      //   setError('Công ty của bạn chưa được xác minh. Vui lòng liên hệ quản trị viên để xác minh công ty trước khi đăng tin tuyển dụng.')
      // } else {
      //   setError(err?.message || 'Không thể tạo tin tuyển dụng. Vui lòng thử lại.')
      // }
      setError(err?.message || 'Không thể tạo tin tuyển dụng. Vui lòng thử lại.')
      
      if (err?.status === 401) {
        navigate('/login?role=recruiter&redirect=' + encodeURIComponent(window.location.pathname))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu đã nhập?')) {
      setForm({
        title: '',
        description: '',
        company_id: company?.id || '',
        location_id: '',
        salary_min: '',
        salary_max: '',
        currency: 'VND',
        job_type: 'full_time',
        experience_level: '',
        expires_at: '',
        requirements: [],
        benefits: [],
        skill_ids: [],
        tag_ids: [],
        work_arrangements: {
          is_remote_allowed: false,
          remote_percentage: 0,
          flexible_hours: false,
          travel_requirement: '',
          overtime_expected: false,
          shift_type: ''
        }
      })
      setSelectedSkillsData([])
      setSelectedTagsData([])
      setLocationSearch('')
      setSelectedLocation(null)
      setSkillSearch('')
      setTagSearch('')
      setError(null)
      setFieldErrors({})
      localStorage.removeItem('postJob_draft')
      setLastSaved(null)
    }
  }
  
  const handleSaveDraft = () => {
    const autoSaveKey = 'postJob_draft'
    localStorage.setItem(autoSaveKey, JSON.stringify({
      form,
      timestamp: new Date().toISOString()
    }))
    setLastSaved(new Date())
    alert('Đã lưu bản nháp thành công!')
  }
  
  const clearDraft = () => {
    localStorage.removeItem('postJob_draft')
    setLastSaved(null)
  }

  if (loading) {
    return (
      <div className="section">
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>Đang tải thông tin công ty...</p>
          <small className="muted" style={{ display: 'block', marginTop: '8px' }}>
            Nếu mất quá nhiều thời gian, vui lòng kiểm tra kết nối mạng hoặc thử lại.
          </small>
        </div>
      </div>
    )
  }

  if (error && !company) {
  return (
    <div className="section">
        <div className="card" style={{ padding: '20px', background: '#fee', border: '1px solid #fcc' }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
          <button className="btn primary" onClick={() => navigate('/onboarding/company')} style={{ marginTop: '12px' }}>
            Tạo công ty
          </button>
        </div>
      </div>
    )
  }

  // Calculate form completion percentage
  const calculateCompletion = () => {
    let completed = 0
    let total = 0
    
    // Basic info
    total += 3
    if (form.title && form.title.length >= 10) completed++
    if (form.description && form.description.length >= 50) completed++
    if (form.company_id) completed++
    
    // Requirements
    if (form.requirements.length > 0) {
      total++
      const validReqs = form.requirements.filter(r => r.title?.trim() && r.requirement_type)
      if (validReqs.length > 0) completed++
    }
    
    // Benefits
    if (form.benefits.length > 0) {
      total++
      const validBenefits = form.benefits.filter(b => b.title?.trim() && b.benefit_type)
      if (validBenefits.length > 0) completed++
    }
    
    // Skills
    total++
    if (form.skill_ids.length > 0) completed++
    
    // Work arrangements (optional)
    
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }
  
  const completionPercentage = calculateCompletion()

  return (
    <div className="section post-job-page">
      <div className="post-job-header">
        <div>
          <h2>Đăng tin tuyển dụng</h2>
          {lastSaved && (
            <p className="last-saved-text">
              Đã lưu lần cuối: {lastSaved.toLocaleTimeString('vi-VN')}
            </p>
          )}
        </div>
        <div className="post-job-actions">
          <Button variant="ghost" onClick={handleSaveDraft} size="small">
            💾 Lưu nháp
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)} size="small">
            👁️ Xem trước
          </Button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <Card className="progress-card" padding="medium">
        <div className="progress-info">
          <span className="progress-label">Tiến độ hoàn thành</span>
          <span className="progress-percentage">{completionPercentage}%</span>
        </div>
        <div className="progress-bar-wrapper">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </Card>
      
      {/* Progress Stepper */}
      <Card className="stepper-card" padding="medium">
        <ProgressStepper steps={steps} currentStep={getCurrentStep()} />
      </Card>
      
      {error && (
        <Card className="error-card" padding="medium">
          <p style={{ color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            {error}
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="post-job-tabs">
        <button 
          type="button"
          className={activeTab === 'basic' ? 'active' : ''}
          onClick={() => setActiveTab('basic')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Thông tin cơ bản
        </button>
        <button 
          type="button"
          className={activeTab === 'requirements' ? 'active' : ''}
          onClick={() => setActiveTab('requirements')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Yêu cầu công việc
        </button>
        <button 
          type="button"
          className={activeTab === 'benefits' ? 'active' : ''}
          onClick={() => setActiveTab('benefits')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          Phúc lợi
        </button>
        <button 
          type="button"
          className={activeTab === 'skills' ? 'active' : ''}
          onClick={() => setActiveTab('skills')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Kỹ năng & Tags
        </button>
        <button 
          type="button"
          className={activeTab === 'work' ? 'active' : ''}
          onClick={() => setActiveTab('work')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          Điều kiện làm việc
        </button>
      </div>

      <form className="card" onSubmit={onSubmit}>
        {/* Tab: Basic Info */}
        {activeTab === 'basic' && (
          <div className="tab-content">
            <label className="field">
              <span>Tiêu đề *</span>
              <input 
                name="title" 
                value={form.title} 
                onChange={onChange} 
                placeholder="VD: Frontend Engineer"
                required
                minLength={10}
                maxLength={255}
                className={fieldErrors.title ? 'error' : ''}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                {fieldErrors.title ? (
                  <small className="error-text">{fieldErrors.title}</small>
                ) : (
                  <small className="muted">Tối thiểu 10 ký tự, tối đa 255 ký tự</small>
                )}
                <small className="muted" style={{ marginLeft: 'auto' }}>
                  {form.title.length}/255
                </small>
              </div>
            </label>

            <label className="field">
              <span>Mô tả *</span>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={onChange}
                placeholder="Mô tả chi tiết về vị trí công việc, yêu cầu, trách nhiệm..."
                rows={8}
                required
                minLength={50}
                className={fieldErrors.description ? 'error' : ''}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                {fieldErrors.description ? (
                  <small className="error-text">{fieldErrors.description}</small>
                ) : (
                  <small className="muted">Tối thiểu 50 ký tự</small>
                )}
                <small className="muted" style={{ marginLeft: 'auto' }}>
                  {form.description.length} ký tự
                </small>
              </div>
            </label>

            <label className="field">
              <span>Công ty *</span>
              <input 
                type="text" 
                value={company?.name || 'Chưa có công ty'} 
                disabled
              />
              <small className="muted">Công ty của bạn</small>
            </label>

            <div className="field-group">
              <label className="field">
                <span>Địa điểm</span>
                {form.location_id && form.location_id.trim() !== '' ? (
                  <div className="selected-item">
                    <span>
                      {selectedLocation?.name || 
                       locations.find(l => l.id === form.location_id)?.name ||
                       initialLocations.find(l => l.id === form.location_id)?.name ||
                       'Đã chọn'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, location_id: '' }))
                        setLocationSearch('')
                        setSelectedLocation(null)
                        setShowLocationDropdown(false)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="autocomplete-wrapper">
                    <input 
                      type="text"
                      value={locationSearch}
                      onChange={(e) => {
                        setLocationSearch(e.target.value)
                        setShowLocationDropdown(true)
                      }}
                      onFocus={() => {
                        setShowLocationDropdown(true)
                        // Show initial locations when focused and no search text
                        if (!locationSearch.trim() && initialLocations.length > 0) {
                          setLocations(initialLocations)
                        }
                      }}
                      onBlur={(e) => {
                        // Delay hiding dropdown to allow click on item
                        setTimeout(() => {
                          const activeElement = document.activeElement
                          if (!activeElement || !activeElement.closest('.autocomplete-dropdown')) {
                            setShowLocationDropdown(false)
                          }
                        }, 150)
                      }}
                      placeholder="Tìm kiếm địa điểm..."
                    />
                    {showLocationDropdown && locations.length > 0 && (
                      <div className="autocomplete-dropdown" onMouseDown={(e) => e.preventDefault()}>
                        {locations.map(loc => (
                          <div 
                            key={loc.id}
                            className="autocomplete-item"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              // Set both state updates together
                              setSelectedLocation(loc)
                              setForm(prev => ({ ...prev, location_id: loc.id }))
                              setLocationSearch('')
                              setShowLocationDropdown(false)
                            }}
                          >
                            {loc.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </label>
            </div>

            <label className="field">
              <span>Loại việc *</span>
              <select name="job_type" value={form.job_type} onChange={onChange} required>
                {JOB_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <div className="field-group">
              <label className="field">
                <span>Lương tối thiểu</span>
                <input 
                  type="number" 
                  name="salary_min" 
                  value={form.salary_min} 
                  onChange={onChange}
                  min="0"
                  className={fieldErrors.salary ? 'error' : ''}
                />
              </label>
              <label className="field">
                <span>Lương tối đa</span>
                <input 
                  type="number" 
                  name="salary_max" 
                  value={form.salary_max} 
                  onChange={onChange}
                  min="0"
                  className={fieldErrors.salary ? 'error' : ''}
                />
              </label>
              <label className="field">
                <span>Tiền tệ</span>
                <select name="currency" value={form.currency} onChange={onChange}>
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </label>
            </div>
            {fieldErrors.salary && <small className="error-text">{fieldErrors.salary}</small>}

            <label className="field">
              <span>Kinh nghiệm (năm)</span>
              <input 
                type="number" 
                name="experience_level" 
                value={form.experience_level} 
                onChange={onChange}
                min="0"
                max="30"
              />
            </label>

            <label className="field">
              <span>Hết hạn</span>
              <input 
                type="datetime-local" 
                name="expires_at" 
                value={form.expires_at} 
                onChange={onChange}
              />
            </label>
          </div>
        )}

        {/* Tab: Requirements */}
        {activeTab === 'requirements' && (
          <div className="tab-content">
            <div className="section-header">
              <h3>Yêu cầu công việc</h3>
              <button type="button" className="btn secondary" onClick={addRequirement}>
                + Thêm yêu cầu
              </button>
            </div>
            {form.requirements.length === 0 && (
              <p className="muted">Chưa có yêu cầu nào. Nhấn "Thêm yêu cầu" để bắt đầu.</p>
            )}
            {form.requirements.map((req, index) => (
              <div key={index} className="dynamic-item">
                <div className="field-group">
                  <label className="field">
                    <span>Loại yêu cầu</span>
                    <select 
                      value={req.requirement_type || ''}
                      onChange={(e) => updateRequirement(index, 'requirement_type', e.target.value)}
                      className={fieldErrors[`requirements.${index}.requirement_type`] ? 'error' : ''}
                    >
                      <option value="">Chọn loại...</option>
                      {REQUIREMENT_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {fieldErrors[`requirements.${index}.requirement_type`] && (
                      <small className="error-text">{fieldErrors[`requirements.${index}.requirement_type`]}</small>
                    )}
                  </label>
                  <label className="field">
                    <span>Tiêu đề *</span>
                    <input 
                      type="text"
                      value={req.title || ''}
                      onChange={(e) => updateRequirement(index, 'title', e.target.value)}
                      placeholder="VD: Tốt nghiệp Đại học"
                      className={fieldErrors[`requirements.${index}.title`] ? 'error' : ''}
                    />
                    {fieldErrors[`requirements.${index}.title`] && (
                      <small className="error-text">{fieldErrors[`requirements.${index}.title`]}</small>
                    )}
                  </label>
                </div>
                <label className="field">
                  <span>Mô tả</span>
                  <textarea 
                    value={req.description || ''}
                    onChange={(e) => updateRequirement(index, 'description', e.target.value)}
                    rows={3}
                    placeholder="Mô tả chi tiết..."
                  />
                </label>
                <div className="field-group">
                  <label className="field">
                    <span>Mức độ</span>
                    <input 
                      type="text"
                      value={req.level || ''}
                      onChange={(e) => updateRequirement(index, 'level', e.target.value)}
                      placeholder="VD: Trung bình"
                      maxLength={50}
                    />
                  </label>
                  <label className="field">
                    <span>Số năm kinh nghiệm</span>
                    <input 
                      type="number"
                      value={req.years_experience || ''}
                      onChange={(e) => updateRequirement(index, 'years_experience', e.target.value)}
                      min="0"
                    />
                  </label>
                  <label className="field checkbox-field">
                    <input 
                      type="checkbox"
                      checked={req.is_required !== false}
                      onChange={(e) => updateRequirement(index, 'is_required', e.target.checked)}
                    />
                    <span>Bắt buộc</span>
                  </label>
                </div>
                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => removeRequirement(index)}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Benefits */}
        {activeTab === 'benefits' && (
          <div className="tab-content">
            <div className="section-header">
              <h3>Phúc lợi</h3>
              <button type="button" className="btn secondary" onClick={addBenefit}>
                + Thêm phúc lợi
              </button>
            </div>
            {form.benefits.length === 0 && (
              <p className="muted">Chưa có phúc lợi nào. Nhấn "Thêm phúc lợi" để bắt đầu.</p>
            )}
            {form.benefits.map((ben, index) => (
              <div key={index} className="dynamic-item">
                <div className="field-group">
                  <label className="field">
                    <span>Loại phúc lợi</span>
                    <select 
                      value={ben.benefit_type || ''}
                      onChange={(e) => updateBenefit(index, 'benefit_type', e.target.value)}
                      className={fieldErrors[`benefits.${index}.benefit_type`] ? 'error' : ''}
                    >
                      <option value="">Chọn loại...</option>
                      {BENEFIT_TYPE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {fieldErrors[`benefits.${index}.benefit_type`] && (
                      <small className="error-text">{fieldErrors[`benefits.${index}.benefit_type`]}</small>
                    )}
                  </label>
                  <label className="field">
                    <span>Tiêu đề *</span>
                    <input 
                      type="text"
                      value={ben.title || ''}
                      onChange={(e) => updateBenefit(index, 'title', e.target.value)}
                      placeholder="VD: Bảo hiểm y tế"
                      className={fieldErrors[`benefits.${index}.title`] ? 'error' : ''}
                    />
                    {fieldErrors[`benefits.${index}.title`] && (
                      <small className="error-text">{fieldErrors[`benefits.${index}.title`]}</small>
                    )}
                  </label>
                </div>
                <label className="field">
                  <span>Mô tả</span>
                  <textarea 
                    value={ben.description || ''}
                    onChange={(e) => updateBenefit(index, 'description', e.target.value)}
                    rows={3}
                    placeholder="Mô tả chi tiết..."
                  />
                </label>
                <div className="field-group">
                  <label className="field">
                    <span>Giá trị</span>
                    <input 
                      type="text"
                      value={ben.value_amount || ''}
                      onChange={(e) => updateBenefit(index, 'value_amount', e.target.value)}
                      placeholder="VD: 1000000"
                    />
                  </label>
                  <label className="field">
                    <span>Tiền tệ</span>
                    <select 
                      value={ben.value_currency || 'VND'}
                      onChange={(e) => updateBenefit(index, 'value_currency', e.target.value)}
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </label>
                </div>
                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => removeBenefit(index)}
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Skills & Tags */}
        {activeTab === 'skills' && (
          <div className="tab-content">
            <div className="field-group">
              <label className="field">
                <span>Kỹ năng</span>
                <div className="autocomplete-wrapper">
                  <input 
                    type="text"
                    value={skillSearch}
                    onChange={(e) => {
                      setSkillSearch(e.target.value)
                      setShowSkillDropdown(true)
                    }}
                    onFocus={() => {
                      setShowSkillDropdown(true)
                      // Show initial skills when focused and no search text
                      if (!skillSearch.trim() && initialSkills.length > 0) {
                        setSkills(initialSkills)
                      }
                    }}
                    onBlur={(e) => {
                      // Delay hiding dropdown to allow click on item
                      setTimeout(() => {
                        if (!e.relatedTarget || !e.relatedTarget.closest('.autocomplete-dropdown')) {
                          setShowSkillDropdown(false)
                        }
                      }, 200)
                    }}
                    placeholder="Tìm kiếm kỹ năng..."
                  />
                  {showSkillDropdown && skills.length > 0 && (
                    <div className="autocomplete-dropdown" onMouseDown={(e) => e.preventDefault()}>
                      {skills
                        .filter(skill => !form.skill_ids.includes(skill.id))
                        .map(skill => (
                          <div 
                            key={skill.id}
                            className="autocomplete-item"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              addSkill(skill)
                            }}
                          >
                            {skill.name}
                            {skill.category && <span className="muted"> ({skill.category})</span>}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {form.skill_ids.length > 0 && (
                  <div className="selected-items">
                    {selectedSkillsData.map(skill => (
                      <span key={skill.id} className="selected-chip">
                        {skill.name}
                        {skill.category && <span className="muted"> ({skill.category})</span>}
                        <button 
                          type="button"
                          onClick={() => removeSkill(skill.id)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>

            <div className="field-group">
              <label className="field">
                <span>Tags</span>
                <div className="autocomplete-wrapper">
                  <input 
                    type="text"
                    value={tagSearch}
                    onChange={(e) => {
                      setTagSearch(e.target.value)
                      setShowTagDropdown(true)
                    }}
                    onFocus={() => {
                      setShowTagDropdown(true)
                      // Show initial tags when focused and no search text
                      if (!tagSearch.trim() && initialTags.length > 0) {
                        setTags(initialTags)
                      }
                    }}
                    onBlur={(e) => {
                      // Delay hiding dropdown to allow click on item
                      setTimeout(() => {
                        const activeElement = document.activeElement
                        if (!activeElement || !activeElement.closest('.autocomplete-dropdown')) {
                          setShowTagDropdown(false)
                        }
                      }, 150)
                    }}
                    placeholder="Tìm kiếm tags..."
                  />
                  {showTagDropdown && tags.length > 0 && (
                    <div className="autocomplete-dropdown" onMouseDown={(e) => e.preventDefault()}>
                      {tags
                        .filter(tag => !form.tag_ids.includes(tag.id))
                        .map(tag => (
                          <div 
                            key={tag.id}
                            className="autocomplete-item"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              addTag(tag)
                            }}
                          >
                            {tag.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {form.tag_ids.length > 0 && (
                  <div className="selected-items">
                    {selectedTagsData.map(tag => (
                      <span key={tag.id} className="selected-chip">
                        {tag.name}
                        <button 
                          type="button"
                          onClick={() => removeTag(tag.id)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Tab: Work Arrangements */}
        {activeTab === 'work' && (
          <div className="tab-content">
            <label className="field checkbox-field">
              <input 
                type="checkbox"
                name="work_arrangements.is_remote_allowed"
                checked={form.work_arrangements.is_remote_allowed}
                onChange={onChange}
              />
              <span>Cho phép làm việc từ xa</span>
            </label>

            {form.work_arrangements.is_remote_allowed && (
              <label className="field">
                <span>Phần trăm làm việc từ xa (%)</span>
                <input 
                  type="number"
                  name="work_arrangements.remote_percentage"
                  value={form.work_arrangements.remote_percentage}
                  onChange={onChange}
                  min="0"
                  max="100"
                  className={fieldErrors.remote_percentage ? 'error' : ''}
                />
                {fieldErrors.remote_percentage && (
                  <small className="error-text">{fieldErrors.remote_percentage}</small>
                )}
                <small className="muted">0-100%</small>
              </label>
            )}

            <label className="field checkbox-field">
              <input 
                type="checkbox"
                name="work_arrangements.flexible_hours"
                checked={form.work_arrangements.flexible_hours}
                onChange={onChange}
              />
              <span>Giờ làm việc linh hoạt</span>
            </label>

            <label className="field">
              <span>Yêu cầu đi công tác</span>
              <input 
                type="text"
                name="work_arrangements.travel_requirement"
                value={form.work_arrangements.travel_requirement}
                onChange={onChange}
                placeholder="VD: Thỉnh thoảng đi công tác"
                maxLength={50}
              />
            </label>

            <label className="field checkbox-field">
              <input 
                type="checkbox"
                name="work_arrangements.overtime_expected"
                checked={form.work_arrangements.overtime_expected}
                onChange={onChange}
              />
              <span>Có thể làm thêm giờ</span>
            </label>

            <label className="field">
              <span>Loại ca làm việc</span>
              <select 
                name="work_arrangements.shift_type"
                value={form.work_arrangements.shift_type}
                onChange={onChange}
              >
                <option value="">Chọn loại ca...</option>
                {SHIFT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <Button variant="ghost" onClick={handleReset} disabled={submitting}>
            Xóa tất cả
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={submitting}>
            Lưu nháp
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={submitting}
            loading={submitting}
          >
            {submitting ? 'Đang tạo...' : 'Đăng tin'}
          </Button>
        </div>
      </form>
      
      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Xem trước tin tuyển dụng"
        size="large"
        className="job-preview-modal"
      >
        <div className="job-preview-content">
          <div className="job-preview-header">
            <h2 className="job-preview-title">{form.title || 'Chưa có tiêu đề'}</h2>
            <div className="job-preview-meta">
              <span>📅 {form.expires_at ? new Date(form.expires_at).toLocaleDateString('vi-VN') : 'Chưa đặt'}</span>
              <span>💼 {JOB_TYPE_OPTIONS.find(opt => opt.value === form.job_type)?.label || form.job_type}</span>
              {form.experience_level && <span>⭐ {form.experience_level} năm kinh nghiệm</span>}
            </div>
          </div>
          
          <div className="job-preview-section">
            <h3>Mô tả công việc</h3>
            <p>{form.description || 'Chưa có mô tả'}</p>
          </div>

          <div className="job-preview-section">
            <h3>Thông tin cơ bản</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <strong style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Công ty:</strong>
                <span>{company?.name || 'Chưa chọn'}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Địa điểm:</strong>
                <span>{locations.find(l => l.id === form.location_id)?.name || 'Chưa chọn'}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Kinh nghiệm:</strong>
                <span>{form.experience_level ? `${form.experience_level} năm` : 'Không yêu cầu'}</span>
              </div>
              <div>
                <strong style={{ color: '#64748b', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Mức lương:</strong>
                <span>
                  {form.salary_min && form.salary_max
                    ? `${parseInt(form.salary_min).toLocaleString()} - ${parseInt(form.salary_max).toLocaleString()} ${form.currency}`
                    : 'Thỏa thuận'}
                </span>
              </div>
            </div>
          </div>
          
          {form.requirements.length > 0 && (
            <div className="job-preview-section">
              <h3>Yêu cầu công việc</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {form.requirements
                  .filter(req => req.title?.trim() && req.requirement_type)
                  .map((req, idx) => (
                    <li key={idx} style={{ marginBottom: '12px', paddingLeft: '20px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#2563eb' }}>•</span>
                      <strong>{REQUIREMENT_TYPE_OPTIONS.find(opt => opt.value === req.requirement_type)?.label}:</strong> {req.title}
                      {req.description && <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>{req.description}</p>}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          
          {form.benefits.length > 0 && (
            <div className="job-preview-section">
              <h3>Phúc lợi</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {form.benefits
                  .filter(ben => ben.title?.trim() && ben.benefit_type)
                  .map((ben, idx) => (
                    <li key={idx} style={{ marginBottom: '12px', paddingLeft: '20px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#22c55e' }}>✓</span>
                      <strong>{BENEFIT_TYPE_OPTIONS.find(opt => opt.value === ben.benefit_type)?.label}:</strong> {ben.title}
                      {ben.description && <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>{ben.description}</p>}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          
          {form.skill_ids.length > 0 && (
            <div className="job-preview-section">
              <h3>Kỹ năng yêu cầu</h3>
              <div className="job-preview-tags">
                {selectedSkillsData.map(skill => (
                  <Badge key={skill.id} variant="primary" size="small">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {form.work_arrangements.is_remote_allowed && (
            <div className="job-preview-section">
              <h3>Điều kiện làm việc</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#2563eb' }}>🏠</span>
                  Làm việc từ xa: {form.work_arrangements.remote_percentage}%
                </li>
                {form.work_arrangements.flexible_hours && (
                  <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#2563eb' }}>⏰</span>
                    Giờ làm việc linh hoạt
                  </li>
                )}
                {form.work_arrangements.travel_requirement && (
                  <li style={{ marginBottom: '8px', paddingLeft: '20px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#2563eb' }}>✈️</span>
                    Đi công tác: {form.work_arrangements.travel_requirement}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
