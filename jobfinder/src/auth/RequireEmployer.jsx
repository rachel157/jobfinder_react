import { Navigate, useLocation } from 'react-router-dom'
import { isEmployer } from './auth.js'

export default function RequireEmployer({ children }){
  const location = useLocation()
  if(!isEmployer()){
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?role=employer&redirect=${redirect}`} replace />
  }
  return children
}

