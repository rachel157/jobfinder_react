import React from 'react'
import './JobsSidebarFilters.css'

export default function JobsSidebarFilters({
  isMobileOpen,
  onToggleMobile,
  locationFilter,
  onLocationChange,
  selectedJobTypes,
  onToggleJobType,
  experienceLevel,
  onExperienceChange,
  salaryMin,
  salaryMax,
  onSalaryMinChange,
  onSalaryMaxChange,
  skills,
  skillInput,
  onSkillInputChange,
  onAddSkill,
  onRemoveSkill,
  jobTypes,
  experienceOptions
}) {
  return (
    <aside className="jobs-sidebar-card">
      <button className="filters-toggle" onClick={onToggleMobile}>
        {isMobileOpen ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}
      </button>
      <div className={`filters-body ${isMobileOpen ? 'open' : ''}`}>
        <div className="filter-block">
          <label className="filter-title">Địa điểm</label>
          <input
            type="text"
            placeholder="Thành phố hoặc quốc gia"
            value={locationFilter}
            onChange={(e) => onLocationChange(e.target.value)}
          />
        </div>

        <div className="filter-block">
          <label className="filter-title">Loại việc</label>
          <div className="filter-options column">
            {jobTypes.map((type) => (
              <label key={type.value} className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedJobTypes.includes(type.value)}
                  onChange={() => onToggleJobType(type.value)}
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-block">
          <label className="filter-title">Kinh nghiệm</label>
          <div className="filter-options column">
            {experienceOptions.map((level) => (
              <label key={level.value} className="radio">
                <input
                  type="radio"
                  name="experience-level"
                  value={level.value}
                  checked={experienceLevel === level.value}
                  onChange={() => onExperienceChange(level.value)}
                />
                <span>{level.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-block">
          <label className="filter-title">Mức lương</label>
          <div className="salary-inputs filter-group--salary">
            <input
              type="number"
              placeholder="Lương tối thiểu"
              value={salaryMin}
              onChange={(e) => onSalaryMinChange(e.target.value)}
            />
            <input
              type="number"
              placeholder="Lương tối đa"
              value={salaryMax}
              onChange={(e) => onSalaryMaxChange(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-block">
          <label className="filter-title">Kỹ năng</label>
          <input
            type="text"
            placeholder="Nhập kỹ năng và nhấn Enter"
            value={skillInput}
            onChange={(e) => onSkillInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAddSkill()
              }
            }}
          />
          <div className="skills-chips">
            {skills.map((skill) => (
              <span key={skill} className="chip">
                {skill}
                <button onClick={() => onRemoveSkill(skill)} aria-label={`Remove ${skill}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
