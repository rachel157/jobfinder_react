/**
 * Tính phần trăm hoàn thành profile dựa trên các trường cơ bản
 * @param {Object} profileData - Profile data (có thể là raw profile hoặc formatted data từ API)
 * @returns {Object} - { percentage: number, details: Object }
 */
export function calculateProfileCompletion(profileData) {
  if (!profileData) {
    return {
      percentage: 0,
      details: {
        fullName: false,
        contact: false,
        bio: false,
        skills: false,
        experiences: false,
        educations: false,
      },
      missingItems: [
        'Họ và tên',
        'Email hoặc số điện thoại',
        'Giới thiệu bản thân',
        'Kỹ năng',
        'Kinh nghiệm làm việc',
        'Học vấn',
      ],
      isComplete: false,
    }
  }

  // Normalize dữ liệu từ API format (có sections) sang format chuẩn
  let profile = profileData
  if (profileData.sections) {
    const sections = profileData.sections
    profile = {
      full_name: sections.personal_info?.data?.full_name,
      email: sections.personal_info?.data?.email,
      phone_number: sections.personal_info?.data?.phone,
      bio: sections.personal_info?.data?.bio,
      skills: sections.skills?.items || [],
      experiences: sections.experiences?.items || [],
      educations: sections.educations?.items || [],
      users: profileData.users || (sections.personal_info?.data?.email ? { email: sections.personal_info.data.email } : null),
    }
  }

  let score = 0
  const details = {}
  const missingItems = []

  // Personal Info (40%)
  // Full name (15%)
  if (profile.full_name?.trim()) {
    score += 15
    details.fullName = true
  } else {
    details.fullName = false
    missingItems.push('Họ và tên')
  }

  // Email hoặc Phone (15%)
  const hasEmail = profile.email || profile.users?.email
  const hasPhone = profile.phone_number?.trim()
  if (hasEmail || hasPhone) {
    score += 15
    details.contact = true
  } else {
    details.contact = false
    missingItems.push('Email hoặc số điện thoại')
  }

  // Bio (10%)
  if (profile.bio?.trim()) {
    score += 10
    details.bio = true
  } else {
    details.bio = false
    missingItems.push('Giới thiệu bản thân')
  }

  // Skills (20%)
  const skills = profile.skills || []
  if (Array.isArray(skills) && skills.length > 0) {
    score += 20
    details.skills = true
  } else {
    details.skills = false
    missingItems.push('Kỹ năng')
  }

  // Experiences (20%)
  const experiences = profile.experiences || []
  if (Array.isArray(experiences) && experiences.length > 0) {
    score += 20
    details.experiences = true
  } else {
    details.experiences = false
    missingItems.push('Kinh nghiệm làm việc')
  }

  // Educations (20%)
  const educations = profile.educations || []
  if (Array.isArray(educations) && educations.length > 0) {
    score += 20
    details.educations = true
  } else {
    details.educations = false
    missingItems.push('Học vấn')
  }

  return {
    percentage: score,
    details,
    missingItems,
    isComplete: score === 100,
  }
}

