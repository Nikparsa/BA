import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Code,
  FileText,
  Play
} from 'lucide-react'
import { assignmentsAPI, submissionsAPI } from '../services/api'
import toast from 'react-hot-toast'

export function Assignments() {
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
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const getSubmissionStatus = (assignmentId) => {
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId)
    if (assignmentSubmissions.length === 0) return null

    const latestSubmission = assignmentSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    return {
      status: latestSubmission.status,
      score: latestSubmission.result?.score,
      attempts: assignmentSubmissions.length
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'queued':
      case 'running':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
      case 'failed':
        return <FileText className="h-5 w-5 text-red-500" />
      default:
        return <Play className="h-5 w-5 text-blue-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'queued':
      case 'running':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
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
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Complete programming assignments and improve your skills</p>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => {
          const submissionStatus = getSubmissionStatus(assignment.id)
          const isCompleted = submissionStatus?.status === 'completed'
          const bestScore = submissionStatus?.score ? Math.round(submissionStatus.score * 100) : 0

          return (
            <div key={assignment.id} className="bg-white rounded-xl shadow-soft p-6 border border-gray-100 hover:shadow-medium transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Code className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{assignment.language}</p>
                  </div>
                </div>
                {submissionStatus && getStatusIcon(submissionStatus.status)}
              </div>

              <div className="mb-4">
                <p className="text-gray-600 text-sm">
                  {assignment.title === 'FizzBuzz' && 
                    'Implement the classic FizzBuzz function with proper edge case handling.'}
                  {assignment.title === 'CSV Statistics' && 
                    'Process CSV data and calculate statistical measures like mean and median.'}
                  {assignment.title === 'Vector2D Class' && 
                    'Create a 2D vector class with mathematical operations and methods.'}
                </p>
              </div>

              {/* Status and Progress */}
              <div className="mb-6">
                {submissionStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submissionStatus.status)}`}>
                        {submissionStatus.status === 'completed' ? 'Completed' :
                         submissionStatus.status === 'queued' ? 'Queued' :
                         submissionStatus.status === 'running' ? 'Running' :
                         submissionStatus.status === 'failed' ? 'Failed' : submissionStatus.status}
                      </span>
                      {submissionStatus.attempts > 1 && (
                        <span className="text-xs text-gray-500">
                          {submissionStatus.attempts} attempts
                        </span>
                      )}
                    </div>
                    {isCompleted && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            bestScore >= 80 ? 'bg-green-500' :
                            bestScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${bestScore}%` }}
                        ></div>
                      </div>
                    )}
                    {isCompleted && (
                      <p className="text-sm text-gray-600">
                        Best Score: <span className="font-semibold">{bestScore}%</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-500">Not started</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex space-x-3">
                <Link
                  to={`/assignments/${assignment.id}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                  {isCompleted ? 'View Details' : 'Start Assignment'}
                </Link>
                {submissionStatus && (
                  <Link
                    to={`/submissions?assignment=${assignment.id}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    History
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
          <p className="mt-1 text-sm text-gray-500">No assignments are available at the moment.</p>
        </div>
      )}
    </div>
  )
}
