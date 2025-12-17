import React from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App.jsx"
import Home from "./pages/Home.jsx"
import Jobs from "./pages/Jobs.jsx"
import JobDetail from "./pages/JobDetail.jsx"
import PostJob from "./pages/PostJob.jsx"
import Login from "./pages/Login.jsx"
import RequireEmployer from "./auth/RequireEmployer.jsx"
import RequireSeeker from "./auth/RequireSeeker.jsx"
import ApplyJob from "./pages/ApplyJob.jsx"
import CompaniesPage from "./pages/CompaniesPage.jsx"
import Register from "./pages/Register.jsx"
import VerifyEmail from "./pages/VerifyEmail.jsx"
import ForgotPassword from "./pages/ForgotPassword.jsx"
import VerifyForgotPassword from "./pages/VerifyForgotPassword.jsx"
import ResetPassword from "./pages/ResetPassword.jsx"
import ChangePassword from "./pages/ChangePassword.jsx"
import Profile from "./pages/Profile.jsx"
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx"
import RecruiterChangePassword from "./pages/RecruiterChangePassword.jsx"
import CompanyOnboardingPage from "./pages/CompanyOnboardingPage.jsx"
import RecruiterCompanyPage from "./pages/RecruiterCompanyPage.jsx"
import RecruiterCompanyGuard from "./pages/RecruiterCompanyGuard.jsx"
import CompanyDetailsPage from "./pages/CompanyDetailsPage.jsx"
import ResumesList from "./pages/ResumesList.jsx"
import ResumeCreate from "./pages/ResumeCreate.jsx"
import ResumeDetail from "./pages/ResumeDetail.jsx"
import SavedJobs from "./pages/SavedJobs.jsx"
import MyApplications from "./pages/MyApplications.jsx"
import MyApplicationDetail from "./pages/MyApplicationDetail.jsx"
import MyJobs from "./pages/MyJobs.jsx"
import JobManage from "./pages/JobManage.jsx"
import ApplicationsList from "./pages/ApplicationsList.jsx"
import ApplicationDetail from "./pages/ApplicationDetail.jsx"
import RequireAdmin from "./auth/RequireAdmin.jsx"
import AdminLayout from "./pages/admin/AdminLayout.jsx"
import AdminDashboard from "./pages/admin/AdminDashboard.jsx"
import AdminUsersList from "./pages/admin/AdminUsersList.jsx"
import AdminUserDetail from "./pages/admin/AdminUserDetail.jsx"
import AdminJobsList from "./pages/admin/AdminJobsList.jsx"
import AdminPendingJobs from "./pages/admin/AdminPendingJobs.jsx"
import AdminJobDetail from "./pages/admin/AdminJobDetail.jsx"
import AdminLogin from "./pages/admin/AdminLogin.jsx"
import "./index.css"

const router = createBrowserRouter(
  [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'companies', element: <CompaniesPage /> },
      { path: 'companies/:id', element: <CompanyDetailsPage /> },
      { path: 'jobs', element: <Jobs /> },
      { path: 'jobs/:id', element: <JobDetail /> },
      { path: 'jobs/:id/apply', element: (
        <RequireSeeker>
          <ApplyJob />
        </RequireSeeker>
      ) },
      { path: 'register', element: <Register /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'auth/verify-email', element: <VerifyEmail /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'verify-forgot-password', element: <VerifyForgotPassword /> },
      { path: 'auth/verify-forgot-password', element: <VerifyForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'auth/reset-password', element: <ResetPassword /> },
      { path: 'change-password', element: <ChangePassword /> },
      { path: 'profile', element: (
        <RequireSeeker>
          <Profile />
        </RequireSeeker>
      ) },
      { path: 'resumes', element: (
        <RequireSeeker>
          <ResumesList />
        </RequireSeeker>
      ) },
      { path: 'resumes/create', element: (
        <RequireSeeker>
          <ResumeCreate />
        </RequireSeeker>
      ) },
      { path: 'resumes/:id', element: (
        <RequireSeeker>
          <ResumeDetail />
        </RequireSeeker>
      ) },
      { path: 'saved-jobs', element: (
        <RequireSeeker>
          <SavedJobs />
        </RequireSeeker>
      ) },
      { path: 'applications', element: (
        <RequireSeeker>
          <MyApplications />
        </RequireSeeker>
      ) },
      { path: 'applications/:id', element: (
        <RequireSeeker>
          <MyApplicationDetail />
        </RequireSeeker>
      ) },
      { path: 'post-job', element: (
        <RequireEmployer>
          <PostJob />
        </RequireEmployer>
      ) },
      { path: 'recruiter/dashboard', element: (
        <RequireEmployer>
          <RecruiterDashboard />
        </RequireEmployer>
      ) },
      { path: 'recruiter/talent-pool', element: (
        <RequireEmployer>
          <RecruiterDashboard />
        </RequireEmployer>
      ) },
      { path: 'recruiter/company', element: (
        <RequireEmployer>
          <RecruiterCompanyGuard>
            <RecruiterCompanyPage />
          </RecruiterCompanyGuard>
        </RequireEmployer>
      ) },
      { path: 'recruiter/change-password', element: (
        <RequireEmployer>
          <RecruiterChangePassword />
        </RequireEmployer>
      ) },
      { path: 'recruiter/jobs', element: (
        <RequireEmployer>
          <RecruiterDashboard />
        </RequireEmployer>
      ) },
      { path: 'recruiter/jobs/:id/manage', element: (
        <RequireEmployer>
          <JobManage />
        </RequireEmployer>
      ) },
      { path: 'recruiter/jobs/:jobId/applications', element: (
        <RequireEmployer>
          <ApplicationsList />
        </RequireEmployer>
      ) },
      { path: 'recruiter/applications/:id', element: (
        <RequireEmployer>
          <ApplicationDetail />
        </RequireEmployer>
      ) },
      { path: 'onboarding/company', element: (
        <RequireEmployer>
          <CompanyOnboardingPage />
        </RequireEmployer>
      ) },
      { path: 'login', element: <Login /> },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsersList /> },
      { path: 'users/:id', element: <AdminUserDetail /> },
      { path: 'jobs', element: <AdminJobsList /> },
      { path: 'jobs/pending', element: <AdminPendingJobs /> },
      { path: 'jobs/:id', element: <AdminJobDetail /> },
    ],
  },
], {
  future: {
    v7_startTransition: true,
  },
})

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
