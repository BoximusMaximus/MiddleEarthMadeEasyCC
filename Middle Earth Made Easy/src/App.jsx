import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import MapPage from './pages/MapPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading" />
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading" />
  return user ? <Navigate to="/" replace /> : children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading" />
  if (!user) return <Navigate to="/login" replace />
  if (user.app_metadata?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
