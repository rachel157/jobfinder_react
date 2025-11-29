import React from 'react'
import JobCard from '../components/JobCard.jsx'

const normalizeJobForCard = (job) => {
  const range = job.salary_range || job.salaryRange || {}
  return {
    id: job.id,
    title: job.title,
    companyName: job.company?.name || job.companyName,
    companyLogoUrl: job.company?.logo_url || job.logo_url,
    location: job.location?.name || job.location || 'Bất kỳ',
    jobType: job.job_type || job.jobType,
    experienceLevel: job.experience_level || job.experienceLevel,
    salary_range: range,
    createdAt: job.posted_at || job.postedAt || job.createdAt,
    descriptionShort: job.description_short || job.descriptionShort || job.description,
  }
}

export default function CompanyJobsSection({ jobs = [], openCount = 0 }) {
  const mappedJobs = jobs.map((job) => normalizeJobForCard(job))

  return (
    <section className="cd-card" id="company-jobs-section">
      <div className="section-head">
        <h3>Các vị trí đang tuyển ({openCount})</h3>
      </div>
      {mappedJobs.length ? (
        <div className="jobs-list cards">
          {mappedJobs.map((job) => (
            <JobCard key={job.id || job.title} job={job} />
          ))}
        </div>
      ) : (
        <p className="muted">Hiện tại công ty chưa có vị trí nào đang tuyển.</p>
      )}
    </section>
  )
}
