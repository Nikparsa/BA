import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Assignments } from './pages/Assignments'
import { Submissions } from './pages/Submissions'
import { TeacherDashboard } from './pages/TeacherDashboard'
import { TeacherAssignments } from './pages/TeacherAssignments'
import { TeacherAnalytics } from './pages/TeacherAnalytics'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Student routes */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="submissions" element={<Submissions />} />
          
          {/* Teacher routes */}
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/assignments" element={<TeacherAssignments />} />
          <Route path="teacher/analytics" element={<TeacherAnalytics />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
