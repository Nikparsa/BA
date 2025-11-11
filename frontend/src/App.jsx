import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Set default axios base URL
axios.defaults.baseURL = 'http://localhost:3000/api';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      loadAssignments();
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      setPage('dashboard');
      
      loadAssignments();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (email, password, role) => {
    try {
      const response = await axios.post('/auth/register', { email, password, role });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      setPage('dashboard');
      
      loadAssignments();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setPage('login');
  };

  const loadAssignments = async () => {
    try {
      const response = await axios.get('/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const submitAssignment = async (assignmentId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', assignmentId);

      const response = await axios.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Submission failed' };
    }
  };

  if (page === 'login') {
    return <LoginPage onLogin={login} onRegister={register} onSwitchToRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    return <RegisterPage onRegister={register} onSwitchToLogin={() => setPage('login')} />;
  }

  return (
    <div>
      <Header user={user} onLogout={logout} onNavigate={setPage} />
      <div className="container">
        {page === 'dashboard' && <Dashboard assignments={assignments} onNavigate={setPage} />}
        {page === 'assignments' && <AssignmentsPage assignments={assignments} onSubmit={submitAssignment} />}
        {page === 'submissions' && <SubmissionsPage submissions={submissions} />}
        {page === 'teacher' && user?.role === 'teacher' && <TeacherDashboard />}
      </div>
    </div>
  );
}

function LoginPage({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2>Login to ACA</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p>
          Don't have an account? 
          <button onClick={onSwitchToRegister} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await onRegister(email, password, role);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '50px auto' }}>
        <h2>Register for ACA</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Role:</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account? 
          <button onClick={onSwitchToLogin} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function Header({ user, onLogout, onNavigate }) {
  return (
    <div className="header">
      <h1>ACA - Automated Code Assessment</h1>
      <div className="nav">
        <a href="#" onClick={() => onNavigate('dashboard')}>Dashboard</a>
        <a href="#" onClick={() => onNavigate('assignments')}>Assignments</a>
        <a href="#" onClick={() => onNavigate('submissions')}>My Submissions</a>
        {user?.role === 'teacher' && (
          <a href="#" onClick={() => onNavigate('teacher')}>Teacher Panel</a>
        )}
        <a href="#" onClick={onLogout}>Logout ({user?.email})</a>
      </div>
    </div>
  );
}

function Dashboard({ assignments, onNavigate }) {
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to the Automated Code Assessment system!</p>
      
      <div className="grid">
        {assignments.map(assignment => (
          <div key={assignment.id} className="card">
            <h3>{assignment.title}</h3>
            <p>{assignment.description}</p>
            <button 
              className="btn" 
              onClick={() => onNavigate('assignments')}
            >
              View Assignment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignmentsPage({ assignments, onSubmit }) {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedAssignment) {
      setMessage('Please select an assignment and file');
      return;
    }

    const result = await onSubmit(selectedAssignment.id, file);
    if (result.success) {
      setMessage('Assignment submitted successfully!');
      setFile(null);
    } else {
      setMessage('Error: ' + result.error);
    }
  };

  return (
    <div>
      <h2>Assignments</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Assignment:</label>
          <select 
            value={selectedAssignment?.id || ''} 
            onChange={(e) => setSelectedAssignment(assignments.find(a => a.id == e.target.value))}
          >
            <option value="">Choose an assignment...</option>
            {assignments.map(assignment => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </div>

        {selectedAssignment && (
          <div className="card">
            <h3>{selectedAssignment.title}</h3>
            <p>{selectedAssignment.description}</p>
            <p><strong>Instructions:</strong></p>
            <ul>
              <li>Create a Python file with your solution</li>
              <li>Name your main function according to the assignment requirements</li>
              <li>Zip your Python file and upload it</li>
            </ul>
          </div>
        )}

        <div className="form-group">
          <label>Upload ZIP file:</label>
          <input 
            type="file" 
            accept=".zip" 
            onChange={(e) => setFile(e.target.files[0])} 
            required 
          />
        </div>

        <button type="submit" className="btn">Submit Assignment</button>
      </form>

      {message && (
        <div className={message.includes('Error') ? 'error' : 'success'}>
          {message}
        </div>
      )}
    </div>
  );
}

function SubmissionsPage({ submissions }) {
  return (
    <div>
      <h2>My Submissions</h2>
      {submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <div className="grid">
          {submissions.map(submission => (
            <div key={submission.id} className="card">
              <h3>Submission #{submission.id}</h3>
              <p>Status: {submission.status}</p>
              <p>File: {submission.filename}</p>
              <p>Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherDashboard() {
  return (
    <div>
      <h2>Teacher Dashboard</h2>
      <p>Teacher analytics and management tools would go here.</p>
      <div className="card">
        <h3>System Statistics</h3>
        <p>Total Assignments: 3</p>
        <p>Active Students: 2</p>
        <p>Total Submissions: 0</p>
      </div>
    </div>
  );
}

export default App;







