import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Plus
} from 'lucide-react'
import { assignmentsAPI, submissionsAPI } from '../services/api'
import toast from 'react-hot-toast'

export function Dashboard() {
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingSubmissions: 0,
    averageScore: 0
  })
  const [recentSubmissions, setRecentSubmissions] = useState([])
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

      // Calculate stats
      const completedSubmissions = submissionsData.filter(s => s.status === 'completed')
      const pendingSubmissions = submissionsData.filter(s => s.status === 'queued' || s.status === 'running')
      const averageScore = completedSubmissions.length > 0 
        ? completedSubmissions.reduce((sum, s) => sum + (s.result?.score || 0), 0) / completedSubmissions.length
        : 0

      setStats({
        totalAssignments: assignmentsData.length,
        completedAssignments: new Set(completedSubmissions.map(s => s.assignmentId)).size,
        pendingSubmissions: pendingSubmissions.length,
        averageScore: Math.round(averageScore * 100)
      })

      setAssignments(assignmentsData)
      setRecentSubmissions(submissionsData.slice(0, 5))
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
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
    </div>
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your coding progress.</p>
        </div>
        <Link
          to="/assignments"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          View Assignments
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assignments"
          value={stats.totalAssignments}
          icon={BookOpen}
          color="bg-blue-500"
          subtitle="Available to complete"
        />
        <StatCard
          title="Completed"
          value={stats.completedAssignments}
          icon={CheckCircle}
          color="bg-green-500"
          subtitle="Successfully submitted"
        />
        <StatCard
          title="Pending"
          value={stats.pendingSubmissions}
          icon={Clock}
          color="bg-yellow-500"
          subtitle="Being evaluated"
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={TrendingUp}
          color="bg-purple-500"
          subtitle="Overall performance"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assignments */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Available Assignments</h2>
            <Link
              to="/assignments"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {assignments.slice(0, 3).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                  <p className="text-sm text-gray-500 capitalize">{assignment.language}</p>
                </div>
                <Link
                  to={`/assignments/${assignment.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Start →
                </Link>
              </div>
            ))}
            {assignments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No assignments available</p>
            )}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
            <Link
              to="/submissions"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Submission #{submission.id}</p>
                    <p className="text-sm text-gray-500">
                      {submission.status === 'completed' ? 'Completed' : 
                       submission.status === 'queued' ? 'Queued' : 
                       submission.status === 'running' ? 'Running' : submission.status}
                    </p>
                  </div>
                </div>
                {submission.result && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    submission.result.score >= 80 ? 'bg-green-100 text-green-800' :
                    submission.result.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(submission.result.score * 100)}%
                  </span>
                )}
              </div>
            ))}
            {recentSubmissions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No submissions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
