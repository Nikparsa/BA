import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, role) => api.post('/auth/register', { email, password, role }),
}

export const assignmentsAPI = {
  getAll: () => api.get('/assignments'),
  getById: (id) => api.get(`/assignments/${id}`),
}

export const submissionsAPI = {
  create: (assignmentId, file) => {
    const formData = new FormData()
    formData.append('assignmentId', assignmentId)
    formData.append('file', file)
    return api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getById: (id) => api.get(`/submissions/${id}`),
  getAll: () => api.get('/submissions'),
}

export const resultsAPI = {
  getBySubmissionId: (submissionId) => api.get(`/results/${submissionId}`),
  getAnalytics: () => api.get('/analytics'),
  exportResults: () => api.get('/export/results', { responseType: 'blob' }),
}
