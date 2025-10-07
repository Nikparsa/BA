import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { assignmentsAPI, submissionsAPI } from '../services/api'
import toast from 'react-hot-toast'

export function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    averageScore: 0,
    completionRate: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentsAPI.getAll(),
        submissionsAPI.getAll()
      ])

      const assignmentsData = assignmentsRes.data || []
      const submissionsData = submissionsRes.data || []

      // Calculate statistics
      const uniqueStudents = new Set(submissionsData.map(s => s.userId)).size
      const completedSubmissions = submissionsData.filter(s => s.status === 'completed')
      const averageScore = completedSubmissions.length > 0 
        ? completedSubmissions.reduce((sum, s) => sum + (s.result?.score || 0), 0) / completedSubmissions.length
        : 0
      const completionRate = assignmentsData.length > 0 
        ? (completedSubmissions.length / (assignmentsData.length * uniqueStudents)) * 100
        : 0

      setStats({
        totalStudents: uniqueStudents,
        totalAssignments: assignmentsData.length,
        totalSubmissions: submissionsData.length,
        averageScore: Math.round(averageScore * 100),
        completionRate: Math.round(completionRate)
      })

      setAssignments(assignmentsData)
      
      // Recent activity (last 10 submissions)
      setRecentActivity(submissionsData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10))
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            <TrendingUp className={`h-4 w-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'queued':
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor student progress and assignment performance</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/teacher/analytics"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-blue-500"
          subtitle="Active users"
        />
        <StatCard
          title="Assignments"
          value={stats.totalAssignments}
          icon={BookOpen}
          color="bg-green-500"
          subtitle="Available tasks"
        />
        <StatCard
          title="Submissions"
          value={stats.totalSubmissions}
          icon={FileText}
          color="bg-purple-500"
          subtitle="Total attempts"
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={TrendingUp}
          color="bg-yellow-500"
          subtitle="Class performance"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={CheckCircle}
          color="bg-indigo-500"
          subtitle="Assignment completion"
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assignment Overview */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Assignment Overview</h2>
            <Link
              to="/teacher/assignments"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Manage assignments
            </Link>
          </div>
          <div className="space-y-4">
            {assignments.map((assignment) => {
              // Calculate stats for this assignment
              const assignmentSubmissions = recentActivity.filter(s => s.assignmentId === assignment.id)
              const completedCount = assignmentSubmissions.filter(s => s.status === 'completed').length
              const totalAttempts = assignmentSubmissions.length
              const avgScore = completedCount > 0 
                ? Math.round(assignmentSubmissions
                    .filter(s => s.status === 'completed' && s.result)
                    .reduce((sum, s) => sum + s.result.score, 0) / completedCount * 100)
                : 0

              return (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{assignment.language}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{completedCount}/{totalAttempts}</p>
                    <p className="text-xs text-gray-500">Avg: {avgScore}%</p>
                  </div>
                </div>
              )
            })}
            {assignments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No assignments created yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link
              to="/teacher/analytics"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getStatusIcon(submission.status)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      Student #{submission.userId}
                    </p>
                    <p className="text-xs text-gray-500">
                      Assignment #{submission.assignmentId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                  {submission.result && (
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(submission.result.score * 100)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
