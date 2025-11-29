import React, { useState } from 'react'
import './CompanyFilters.css'

export default function CompanyFilters({
  filters,
  onChange,
  onClear,
  sizeOptions,
  industryOptions,
  locationOptions,
  companyTypeOptions
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleInput = (key, value) => {
    onChange({ [key]: value })
  }

  const content = (
    <div className="filters-card">
      <div className="filters-header">
        <h3>Tìm theo tên công ty</h3>
        <p className="filters-sub">Lọc nhanh danh sách nhà tuyển dụng</p>
      </div>

      <div className="filters-group">
        <label className="filters-label">Tìm theo tên công ty</label>
        <input
          className="filters-input"
          type="text"
          placeholder="Nhập tên công ty"
          value={filters.search}
          onChange={(e) => handleInput('search', e.target.value)}
        />
      </div>

      <div className="filters-group">
        <label className="filters-label">Ngành</label>
        <select
          className="filters-select"
          value={filters.industry}
          onChange={(e) => handleInput('industry', e.target.value)}
        >
          {industryOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group">
        <label className="filters-label">Địa điểm</label>
        <select
          className="filters-select"
          value={filters.locationId}
          onChange={(e) => handleInput('locationId', e.target.value)}
        >
          {locationOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group">
        <label className="filters-label">Loại hình công ty</label>
        <select
          className="filters-select"
          value={filters.companyType}
          onChange={(e) => handleInput('companyType', e.target.value)}
        >
          {companyTypeOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group">
        <label className="filters-label">Quy mô</label>
        <select
          className="filters-select"
          value={filters.sizeRange}
          onChange={(e) => handleInput('sizeRange', e.target.value)}
        >
          {sizeOptions.map((opt) => (
            <option key={opt.value || opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters-group filters-checkbox">
        <label>
          <input
            type="checkbox"
            checked={filters.hasOpenJobs}
            onChange={(e) => handleInput('hasOpenJobs', e.target.checked)}
          />
          <span>Chỉ hiển thị công ty đang tuyển</span>
        </label>
      </div>

      <button className="filters-reset" onClick={onClear} type="button">
        Xóa bộ lọc
      </button>
    </div>
  )

  return (
    <div className="filters-sidebar">
      <button className="filters-toggle" onClick={() => setMobileOpen((v) => !v)}>
        {mobileOpen ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}
      </button>
      <div className={`filters-desktop ${mobileOpen ? 'open' : ''}`}>{content}</div>
    </div>
  )
}
