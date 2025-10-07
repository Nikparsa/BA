import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  FileText,
  Download,
  RefreshCw
} from 'lucide-react'
import { assignmentsAPI, submissionsAPI } from '../services/api'
import toast from 'react-hot-toast'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export function TeacherAnalytics() {
  const [analytics, setAnalytics] = useState({
    assignmentStats: [],
    scoreDistribution: [],
    submissionTrends: [],
    studentPerformance: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        assignmentsAPI.getAll(),
        submissionsAPI.getAll()
      ])

      const assignments = assignmentsRes.data || []
      const submissions = submissionsRes.data || []

      // Generate assignment statistics
      const assignmentStats = assignments.map(assignment => {
        const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignment.id)
        const completedSubmissions = assignmentSubmissions.filter(s => s.status === 'completed')
        const avgScore = completedSubmissions.length > 0 
          ? Math.round(completedSubmissions.reduce((sum, s) => sum + (s.result?.score || 0), 0) / completedSubmissions.length * 100)
          : 0
        
        return {
          name: assignment.title,
          submissions: assignmentSubmissions.length,
          completed: completedSubmissions.length,
          avgScore: avgScore,
          students: new Set(assignmentSubmissions.map(s => s.userId)).size
        }
      })

      // Score distribution
      const scoreDistribution = [
        { name: '90-100%', value: 0, color: '#10B981' },
        { name: '80-89%', value: 0, color: '#3B82F6' },
        { name: '70-79%', value: 0, color: '#F59E0B' },
        { name: '60-69%', value: 0, color: '#EF4444' },
        { name: '<60%', value: 0, color: '#DC2626' }
      ]

      submissions
        .filter(s => s.status === 'completed' && s.result)
        .forEach(submission => {
          const score = Math.round(submission.result.score * 100)
          if (score >= 90) scoreDistribution[0].value++
          else if (score >= 80) scoreDistribution[1].value++
          else if (score >= 70) scoreDistribution[2].value++
          else if (score >= 60) scoreDistribution[3].value++
          else scoreDistribution[4].value++
        })

      // Submission trends (last 7 days)
      const submissionTrends = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const daySubmissions = submissions.filter(s => {
          const submissionDate = new Date(s.createdAt)
          return submissionDate.toDateString() === date.toDateString()
        })
        
        submissionTrends.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          submissions: daySubmissions.length,
          completed: daySubmissions.filter(s => s.status === 'completed').length
        })
      }

      // Student performance
      const studentPerformance = []
      const studentMap = new Map()
      
      submissions.forEach(submission => {
        if (!studentMap.has(submission.userId)) {
          studentMap.set(submission.userId, {
            userId: submission.userId,
            totalSubmissions: 0,
            completedSubmissions: 0,
            totalScore: 0
          })
        }
        
        const student = studentMap.get(submission.userId)
        student.totalSubmissions++
        if (submission.status === 'completed' && submission.result) {
          student.completedSubmissions++
          student.totalScore += submission.result.score
        }
      })

      studentMap.forEach(student => {
        studentPerformance.push({
          name: `Student ${student.userId}`,
          submissions: student.totalSubmissions,
          completed: student.completedSubmissions,
          avgScore: student.completedSubmissions > 0 
            ? Math.round((student.totalScore / student.completedSubmissions) * 100)
            : 0
        })
      })

      setAnalytics({
        assignmentStats,
        scoreDistribution,
        submissionTrends,
        studentPerformance: studentPerformance.slice(0, 10) // Top 10 students
      })
    } catch (error) {
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    toast.success('Export functionality coming soon!')
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
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into student performance and engagement</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={exportAnalytics}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assignment Performance */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Assignment Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.assignmentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#3B82F6" name="Average Score (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.scoreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Submission Trends */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Submission Trends (7 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.submissionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="submissions" stroke="#3B82F6" strokeWidth={2} name="Total Submissions" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Student Performance */}
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Student Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.studentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#10B981" name="Average Score (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.assignmentStats.length > 0 
                  ? Math.round(analytics.assignmentStats.reduce((sum, a) => sum + a.avgScore, 0) / analytics.assignmentStats.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(analytics.studentPerformance.map(s => s.name)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.assignmentStats.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.assignmentStats.reduce((sum, a) => sum + a.submissions, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
