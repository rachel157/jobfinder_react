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
import "./index.css"

const router = createBrowserRouter([
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
      { path: 'onboarding/company', element: (
        <RequireEmployer>
          <CompanyOnboardingPage />
        </RequireEmployer>
      ) },
      { path: 'login', element: <Login /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
