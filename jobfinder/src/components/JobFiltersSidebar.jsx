import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import './JobFiltersSidebar.css'

const JOB_TYPES = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'intern', label: 'Intern' },
  { value: 'freelance', label: 'Freelance' }
]

const EXPERIENCE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' }
]

export default function JobFiltersSidebar({ filters, onChange, onApply, onClear }) {
  const [skillInput, setSkillInput] = useState('')
  const [sliderValue, setSliderValue] = useState(
    typeof filters?.maxSalary === 'number' ? filters.maxSalary : 0
  )

  const location = filters?.location || ''
  const jobTypes = filters?.jobTypes || []
  const experience = filters?.experience || 'any'
  const minSalary = typeof filters?.minSalary === 'number' ? filters.minSalary : ''
  const maxSalary = typeof filters?.maxSalary === 'number' ? filters.maxSalary : ''
  const skills = filters?.skills || []

  useEffect(() => {
    if (typeof filters?.maxSalary === 'number') {
      setSliderValue(filters.maxSalary)
    }
  }, [filters?.maxSalary])

  const updateFilters = (patch) => {
    onChange({ ...filters, ...patch })
  }

  const toggleJobType = (value) => {
    const next = jobTypes.includes(value)
      ? jobTypes.filter((t) => t !== value)
      : [...jobTypes, value]
    updateFilters({ jobTypes: next })
  }

  const setExperience = (value) => {
    updateFilters({ experience: value })
  }

  const handleSalaryChange = (key, rawValue) => {
    const numeric = rawValue === '' ? undefined : Number(rawValue)
    updateFilters({ [key]: Number.isFinite(numeric) ? numeric : undefined })
  }

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value) return
    const exists = skills.some((skill) => skill.toLowerCase() === value.toLowerCase())
    if (!exists) {
      updateFilters({ skills: [...skills, value] })
    }
    setSkillInput('')
  }

  const removeSkill = (skill) => {
    updateFilters({ skills: skills.filter((item) => item !== skill) })
  }

  const sliderLabel = useMemo(() => {
    const number = typeof maxSalary === 'number' ? maxSalary : sliderValue
    if (!number) return 'Set a max salary'
    return `Up to $${number.toLocaleString()}`
  }, [maxSalary, sliderValue])

  return (
    <aside className="job-filters-sidebar" aria-label="Job filters">
      <div className="sidebar-header">
        <h3>Filters</h3>
        <p>Narrow down the best jobs for you.</p>
      </div>

      <div className="filter-section">
        <div className="section-label">Location</div>
        <label className="input-with-icon">
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s-6-4.6-6-10a6 6 0 0 1 12 0c0 5.4-6 10-6 10Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11" r="2.5" fill="currentColor" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="City or country"
            value={location}
            onChange={(e) => updateFilters({ location: e.target.value })}
            aria-label="Location"
          />
        </label>
      </div>

      <div className="filter-section">
        <div className="section-label">Job type</div>
        <div className="pill-grid" role="group" aria-label="Job type">
          {JOB_TYPES.map((type) => {
            const active = jobTypes.includes(type.value)
            return (
              <button
                key={type.value}
                type="button"
                className={`pill${active ? ' pill--active' : ''}`}
                onClick={() => toggleJobType(type.value)}
                aria-pressed={active}
              >
                {type.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-section">
        <div className="section-label">Experience level</div>
        <div className="segmented" role="radiogroup" aria-label="Experience level">
          {EXPERIENCE_OPTIONS.map((option) => {
            const active = option.value === experience
            return (
              <button
                key={option.value}
                type="button"
                className={`segment${active ? ' segment--active' : ''}`}
                role="radio"
                aria-checked={active}
                onClick={() => setExperience(option.value)}
              >
                {active && (
                  <span className="check-icon" aria-hidden="true">
                    ✓
                  </span>
                )}
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="filter-section">
        <div className="section-label">Salary range (USD / month)</div>
        <div className="range-inputs">
          <label className="range-field">
            <span>Min</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={minSalary}
              onChange={(e) => handleSalaryChange('minSalary', e.target.value)}
              placeholder="Min"
            />
          </label>
          <label className="range-field">
            <span>Max</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={maxSalary}
              onChange={(e) => handleSalaryChange('maxSalary', e.target.value)}
              placeholder="Max"
            />
          </label>
        </div>
        <div className="range-slider">
          <input
            type="range"
            min="0"
            max="20000"
            step="250"
            value={typeof maxSalary === 'number' ? maxSalary : sliderValue}
            onChange={(e) => {
              const next = Number(e.target.value)
              setSliderValue(next)
              updateFilters({ maxSalary: next })
            }}
            aria-label="Maximum salary"
          />
          <div className="slider-value">{sliderLabel}</div>
        </div>
        <p className="caption">Leave blank for no limit</p>
      </div>

      <div className="filter-section">
        <div className="section-label">Skills</div>
        <label className="skill-input">
          <input
            type="text"
            placeholder="Type a skill and press Enter"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
            aria-label="Add skill"
          />
          <button type="button" className="add-skill" onClick={addSkill} aria-label="Add skill">
            +
          </button>
        </label>
        {!!skills.length && (
          <div className="skills-tags" aria-label="Selected skills">
            {skills.map((skill) => (
              <span key={skill} className="skill-tag">
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() => removeSkill(skill)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="actions-sticky">
        <button type="button" className="btn-primary" onClick={onApply}>
          Apply filters
        </button>
        <button type="button" className="btn-ghost" onClick={onClear}>
          Clear all
        </button>
      </div>
    </aside>
  )
}

JobFiltersSidebar.propTypes = {
  filters: PropTypes.shape({
    location: PropTypes.string,
    jobTypes: PropTypes.arrayOf(PropTypes.string),
    experience: PropTypes.oneOf(['any', 'junior', 'mid', 'senior']),
    minSalary: PropTypes.number,
    maxSalary: PropTypes.number,
    skills: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
}
