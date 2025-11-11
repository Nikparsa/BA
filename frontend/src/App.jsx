import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000/api';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', description: 'Key metrics at a glance', roles: ['student', 'teacher'] },
  { id: 'assignments', label: 'Assignments', description: 'Browse and submit coursework', roles: ['student', 'teacher'] },
  { id: 'submissions', label: 'My Submissions', description: 'Track feedback in real-time', roles: ['student'] },
  { id: 'teacher', label: 'Teacher Center', description: 'Manage classes and insights', roles: ['teacher'] }
];

function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    if (token && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setActiveSection(parsedUser.role === 'teacher' ? 'overview' : 'assignments');
      hydrateData();
    }
  }, []);

  useEffect(() => {
    if (user) {
      hydrateData();
    }
  }, [user]);

  const hydrateData = async () => {
    try {
      const response = await axios.get('/assignments');
      setAssignments(response.data);
      if (!selectedAssignment && response.data.length) {
        setSelectedAssignment(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/auth/login', { email, password });
      const { token, user: userData } = data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      setActiveSection('overview');
      setStatusMessage({ type: 'success', text: `Welcome back, ${userData.email.split('@')[0]}!` });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, role) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/auth/register', { email, password, role });
      const { token, user: userData } = data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      setActiveSection('overview');
      setStatusMessage({ type: 'success', text: 'Your account is ready. Explore your dashboard!' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setAssignments([]);
    setSubmissions([]);
    setActiveSection('overview');
  };

  const submitAssignment = async (assignmentId, file) => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', assignmentId);

      const { data } = await axios.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const optimisticSubmission = {
        id: data.submissionId,
        assignmentId,
        filename: file.name,
        status: 'queued',
        createdAt: new Date().toISOString()
      };

      setSubmissions((prev) => [optimisticSubmission, ...prev]);
      setStatusMessage({ type: 'success', text: 'Submission received. We will notify you once grading is complete.' });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Submission failed. Please try again.';
      setStatusMessage({ type: 'error', text: message });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;
    const queuedSubmissions = submissions.filter((item) => item.status === 'queued').length;

    return [
      { label: 'Assignments', value: totalAssignments, caption: 'Available courses' },
      { label: 'Active Submissions', value: queuedSubmissions, caption: 'Awaiting evaluation' },
      { label: 'Total Submissions', value: totalSubmissions, caption: 'Your activity log' }
    ];
  }, [assignments, submissions]);

  if (!user) {
    return (
      <AuthLayout>
        <AuthHero />
        <AuthPanel onLogin={login} onRegister={register} loading={loading} />
      </AuthLayout>
    );
  }

  const availableSections = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <AppLayout
      user={user}
      activeSection={activeSection}
      onChangeSection={setActiveSection}
      onLogout={logout}
      navItems={availableSections}
    >
      {statusMessage && (
        <MessageBanner type={statusMessage.type} onClose={() => setStatusMessage(null)}>
          {statusMessage.text}
        </MessageBanner>
      )}

      {activeSection === 'overview' && (
        <OverviewSection stats={stats} assignments={assignments} submissions={submissions} />
      )}

      {activeSection === 'assignments' && (
        <AssignmentsSection
          assignments={assignments}
          selectedAssignment={selectedAssignment}
          onSelectAssignment={setSelectedAssignment}
          onSubmit={submitAssignment}
          loading={loading}
        />
      )}

      {activeSection === 'submissions' && (
        <SubmissionsSection submissions={submissions} assignments={assignments} />
      )}

      {activeSection === 'teacher' && user.role === 'teacher' && (
        <TeacherSection assignments={assignments} submissions={submissions} />
      )}
    </AppLayout>
  );
}

function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-wrapper">
        {children}
      </div>
    </div>
  );
}

function AuthHero() {
  return (
    <div className="auth-hero">
      <div>
        <span className="badge badge-primary">ACA Platform</span>
        <h1>Learning reimagined for modern teams.</h1>
        <p>
          Deliver rich assignments, streamline submissions, and give actionable feedback—
          on a platform built for ambitious educators and students.
        </p>
      </div>
      <div className="hero-illustration">
        <div className="hero-card">
          <strong>Automated Grading</strong>
          <p>Faster reviews with detailed analytics and targeted feedback.</p>
        </div>
        <div className="hero-card secondary">
          <strong>Real-time Insights</strong>
          <p>Track class progress and performance in a single dashboard.</p>
        </div>
      </div>
    </div>
  );
}

function AuthPanel({ onLogin, onRegister, loading }) {
  const [mode, setMode] = useState('login');

  const copy = mode === 'login'
    ? {
        title: 'Welcome to ACA',
        subtitle: 'Sign in to continue or create a new account to get started.'
      }
    : {
        title: 'Create your ACA account',
        subtitle: 'Set up your workspace and start collaborating with your cohort.'
      };

  return (
    <div className="auth-card">
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
        >
          Create account
        </button>
      </div>

      <div className="auth-card-body">
        <h2>{copy.title}</h2>
        <p>{copy.subtitle}</p>

        {mode === 'login' ? (
          <LoginForm onLogin={onLogin} loading={loading} />
        ) : (
          <RegisterForm onRegister={onRegister} loading={loading} />
        )}
      </div>
    </div>
  );
}

function LoginForm({ onLogin, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const result = await onLogin(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@academy.com"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </PrimaryButton>
    </form>
  );
}

function RegisterForm({ onRegister, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const result = await onRegister(email, password, role);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} noValidate>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your.name@academy.com"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a strong password"
          autoComplete="new-password"
          required
        />
      </div>
      <div>
        <label>Role</label>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
      </div>
      {error && <p className="form-error">{error}</p>}
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? 'Creating…' : 'Create account'}
      </PrimaryButton>
    </form>
  );
}

function AppLayout({ user, activeSection, navItems, onChangeSection, onLogout, children }) {
  const activeItem = navItems.find((item) => item.id === activeSection);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo">ACA</div>
          <div className="brand-copy">
            <strong>Automated Code Assessment</strong>
            <span>Learning Suite</span>
          </div>
        </div>
        <nav className="top-tabs">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`top-tab ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => onChangeSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <span className="user-chip">{user.email}</span>
          <SecondaryButton onClick={onLogout}>Sign out</SecondaryButton>
        </div>
      </header>
      <main className="main-content">
        <section className="content-header">
          <div>
            <h1>{activeItem?.label}</h1>
            <p>{activeItem?.description}</p>
          </div>
          <span className="badge badge-soft">Role: {user.role}</span>
        </section>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}

function OverviewSection({ stats, assignments, submissions }) {
  return (
    <div className="space-y">
      <section className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <h3>{stat.label}</h3>
            <p className="stat-value">{stat.value}</p>
            <span>{stat.caption}</span>
          </div>
        ))}
      </section>

      <section className="card highlighted">
        <div>
          <h2>Continue your learning journey</h2>
          <p>Pick up where you left off and keep your momentum going.</p>
        </div>
        <div className="progress-pills">
          {assignments.map((assignment) => (
            <span key={assignment.id} className="badge badge-soft">
              {assignment.title}
            </span>
          ))}
          {assignments.length === 0 && <span>No assignments available yet.</span>}
        </div>
      </section>

      <section className="card">
        <h2>Recent submissions</h2>
        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Submit your first assignment to see feedback and automated scoring results here."
          />
        ) : (
          <ul className="timeline">
            {submissions.slice(0, 5).map((submission) => (
              <li key={submission.id}>
                <div>
                  <strong>Submission #{submission.id}</strong>
                  <p>{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                <span className={`status-pill status-${submission.status}`}>
                  {submission.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AssignmentsSection({
  assignments,
  selectedAssignment,
  onSelectAssignment,
  onSubmit,
  loading
}) {
  const [file, setFile] = useState(null);
  const [localMessage, setLocalMessage] = useState(null);

  useEffect(() => {
    if (!selectedAssignment && assignments.length) {
      onSelectAssignment(assignments[0]);
    }
  }, [assignments, selectedAssignment, onSelectAssignment]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !selectedAssignment) {
      setLocalMessage({ type: 'error', text: 'Select an assignment and upload a ZIP file.' });
      return;
    }

    const result = await onSubmit(selectedAssignment.id, file);
    if (result.success) {
      setFile(null);
      setLocalMessage({ type: 'success', text: 'Assignment submitted successfully.' });
    } else {
      setLocalMessage({ type: 'error', text: result.error });
    }
  };

  return (
    <div className="two-column">
      <div className="card assignments-list">
        <h2>Assignments</h2>
        <p>Select a project to view details and submit your work.</p>
        <div className="assignment-items">
          {assignments.map((assignment) => (
            <button
              key={assignment.id}
              className={`assignment-item ${
                selectedAssignment?.id === assignment.id ? 'active' : ''
              }`}
              onClick={() => onSelectAssignment(assignment)}
            >
              <div>
                <h3>{assignment.title}</h3>
                <p>{assignment.description}</p>
              </div>
              <span className="badge badge-soft">View brief</span>
            </button>
          ))}
          {assignments.length === 0 && (
            <EmptyState
              title="No assignments published"
              description="Your courses will appear here once assigned by your instructor."
            />
          )}
        </div>
      </div>

      <div className="card submission-panel">
        {selectedAssignment ? (
          <>
            <header>
              <h2>{selectedAssignment.title}</h2>
              <p>{selectedAssignment.description}</p>
            </header>
            <div className="submission-guidelines">
              <h3>Submission guidelines</h3>
              <ul>
                <li>Package your solution in a single ZIP file.</li>
                <li>Ensure your main entry point matches the assignment requirements.</li>
                <li>Include documentation or README if necessary.</li>
              </ul>
            </div>

            <form className="upload-form" onSubmit={handleSubmit}>
              <label className="file-input">
                <span>{file ? file.name : 'Upload ZIP archive'}</span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(event) => setFile(event.target.files[0])}
                />
              </label>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit assignment'}
              </PrimaryButton>
            </form>

            {localMessage && (
              <MessageBanner type={localMessage.type} onClose={() => setLocalMessage(null)}>
                {localMessage.text}
              </MessageBanner>
            )}
          </>
        ) : (
          <EmptyState
            title="Choose an assignment"
            description="Select an assignment from the list to review requirements and upload your solution."
          />
        )}
      </div>
    </div>
  );
}

function SubmissionsSection({ submissions, assignments }) {
  const lookupTitle = (assignmentId) =>
    assignments.find((assignment) => assignment.id === assignmentId)?.title || 'Assignment';

  return (
    <div className="card">
      <h2>My submissions</h2>
      <p>Monitor grading progress and revisit previous uploads.</p>

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Once you submit assignments, they will be tracked here with status and feedback."
        />
      ) : (
        <div className="submission-table">
          <div className="submission-table-header">
            <span>Assignment</span>
            <span>Submitted</span>
            <span>Status</span>
            <span>File</span>
          </div>
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-table-row">
              <span>{lookupTitle(submission.assignmentId)}</span>
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
              <span className={`status-pill status-${submission.status}`}>
                {submission.status}
              </span>
              <span>{submission.filename}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeacherSection({ assignments, submissions }) {
  const totalStudents = 42;
  const totalAssignments = assignments.length;
  const totalSubmissions = submissions.length;

  return (
    <div className="space-y">
      <section className="stat-grid">
        <div className="stat-card">
          <h3>Active students</h3>
          <p className="stat-value">{totalStudents}</p>
          <span>Across your enrolled cohorts</span>
        </div>
        <div className="stat-card">
          <h3>Published assignments</h3>
          <p className="stat-value">{totalAssignments}</p>
          <span>Actively assigned this term</span>
        </div>
        <div className="stat-card">
          <h3>Total submissions</h3>
          <p className="stat-value">{totalSubmissions}</p>
          <span>Pending and graded</span>
        </div>
      </section>

      <section className="card highlighted">
        <h2>Insights snapshot</h2>
        <ul className="insights-list">
          <li>
            <strong>85%</strong> of students submitted on time for the latest assignment.
          </li>
          <li>
            Top performers: <span className="badge badge-soft">Advanced Python</span>
            <span className="badge badge-soft">Data Structures</span>
          </li>
          <li>
            <strong>Recommended action:</strong> Share targeted feedback to boost participation.
          </li>
        </ul>
      </section>
    </div>
  );
}

function MessageBanner({ type = 'info', children, onClose }) {
  return (
    <div className={`message-banner message-${type}`}>
      <span>{children}</span>
      <button onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button className="btn primary" {...props}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, ...props }) {
  return (
    <button className="btn secondary" {...props}>
      {children}
    </button>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default App;







