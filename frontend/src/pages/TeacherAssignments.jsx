import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Eye
} from 'lucide-react'
import { assignmentsAPI, submissionsAPI } from '../services/api'
import toast from 'react-hot-toast'

export function TeacherAssignments() {
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentsAPI.getAll(),
        submissionsAPI.getAll()
      ])

      setAssignments(assignmentsRes.data || [])
      setSubmissions(submissionsRes.data || [])
    } catch (error) {
      toast.error('Failed to load assignments data')
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStats = (assignmentId) => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId)
    const totalSubmissions = assignmentSubmissions.length
    const completedSubmissions = assignmentSubmissions.filter(s => s.status === 'completed')
    const failedSubmissions = assignmentSubmissions.filter(s => s.status === 'failed')
    const pendingSubmissions = assignmentSubmissions.filter(s => s.status === 'queued' || s.status === 'running')
    
    const uniqueStudents = new Set(assignmentSubmissions.map(s => s.userId)).size
    const avgScore = completedSubmissions.length > 0 
      ? Math.round(completedSubmissions.reduce((sum, s) => sum + (s.result?.score || 0), 0) / completedSubmissions.length * 100)
      : 0

    return {
      totalSubmissions,
      completedSubmissions: completedSubmissions.length,
      failedSubmissions: failedSubmissions.length,
      pendingSubmissions: pendingSubmissions.length,
      uniqueStudents,
      avgScore,
      completionRate: uniqueStudents > 0 ? Math.round((completedSubmissions.length / uniqueStudents) * 100) : 0
    }
  }

  const exportResults = async (assignmentId) => {
    try {
      // This would call a backend endpoint to export results
      toast.success('Export functionality coming soon!')
    } catch (error) {
      toast.error('Failed to export results')
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
          <h1 className="text-3xl font-bold text-gray-900">Assignment Management</h1>
          <p className="text-gray-600 mt-1">Monitor and analyze assignment performance</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <BookOpen className="h-4 w-4 mr-2" />
          Create Assignment
        </button>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignments.map((assignment) => {
          const stats = getAssignmentStats(assignment.id)
          
          return (
            <div key={assignment.id} className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{assignment.language}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.uniqueStudents}</div>
                  <div className="text-xs text-gray-500">Students</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</div>
                  <div className="text-xs text-gray-500">Submissions</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.avgScore}%</div>
                  <div className="text-xs text-gray-500">Avg Score</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.completionRate}%</div>
                  <div className="text-xs text-gray-500">Completion</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Completed</span>
                    <span className="text-gray-900">{stats.completedSubmissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${stats.totalSubmissions > 0 ? (stats.completedSubmissions / stats.totalSubmissions) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Failed</span>
                    <span className="text-gray-900">{stats.failedSubmissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${stats.totalSubmissions > 0 ? (stats.failedSubmissions / stats.totalSubmissions) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Pending</span>
                    <span className="text-gray-900">{stats.pendingSubmissions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${stats.totalSubmissions > 0 ? (stats.pendingSubmissions / stats.totalSubmissions) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  <Eye className="h-4 w-4 mx-auto" />
                </button>
                <button 
                  onClick={() => exportResults(assignment.id)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first assignment to get started.</p>
          <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
            <BookOpen className="h-4 w-4 mr-2" />
            Create Assignment
          </button>
        </div>
      )}
    </div>
  )
}
