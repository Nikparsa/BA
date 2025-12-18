import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000/api';

const NAV_ITEMS = [
  { id: 'assignments', label: 'Assignments', description: 'Browse and submit coursework', roles: ['student', 'teacher'] },
  { id: 'submissions', label: 'My Submissions', description: 'Track feedback in real-time', roles: ['student'] },
  { id: 'teacher', label: 'Teacher Center', description: 'Manage classes and insights', roles: ['teacher'] }
];

const GRADE_BANDS = [
  { min: 90, label: 'Sehr gut', className: 'status-grade-excellent' },
  { min: 80, label: 'Gut', className: 'status-grade-good' },
  { min: 65, label: 'Befriedigend', className: 'status-grade-satisfactory' },
  { min: 50, label: 'Genügend', className: 'status-grade-sufficient' },
  { min: 0, label: 'Nicht genügend', className: 'status-grade-insufficient' }
];

function getGradeInfo(score) {
  if (score === undefined || score === null) {
    return null;
  }

  const rawPercent = score * 100;
  const percent = Math.round(rawPercent);
  for (const band of GRADE_BANDS) {
    if (rawPercent >= band.min) {
      return { ...band, percent };
    }
  }
  return null;
}

function getSubmissionStatusInfo(submission) {
  if (!submission) {
    return { label: 'Unbekannt', className: 'status-default' };
  }

  if (submission.status === 'queued') {
    return { label: 'In Bewertung', className: 'status-queued' };
  }

  const gradeInfo = getGradeInfo(submission.score);
  if (gradeInfo) {
    return gradeInfo;
  }

  if (submission.status) {
    return { label: submission.status, className: 'status-default' };
  }

  return { label: 'Unbekannt', className: 'status-default' };
}

function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [createAssignmentForm, setCreateAssignmentForm] = useState({
    slug: '',
    title: '',
    description: '',
    details: ''
  });
  const [testFile, setTestFile] = useState(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
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
      setActiveSection(parsedUser.role === 'teacher' ? 'teacher' : 'assignments');
      hydrateData(parsedUser);
    }
  }, []);

  useEffect(() => {
    if (user) {
      hydrateData();
    }
  }, [user]);

  const hydrateData = async (userOverride = null) => {
    try {
      const [assignmentsResponse, submissionsResponse] = await Promise.all([
        axios.get('/assignments'),
        axios.get('/submissions').catch(() => ({ data: [] })) // Fallback if no submissions
      ]);
      setAssignments(assignmentsResponse.data);
      setSubmissions(submissionsResponse.data);
      if (!selectedAssignment && assignmentsResponse.data.length) {
        setSelectedAssignment(assignmentsResponse.data[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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
      setActiveSection('assignments');
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
      setActiveSection('assignments');
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
    setAssignmentTemplates([]);
    setShowCreateAssignment(false);
    setActiveSection('assignments');
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

      // Reload submissions from backend to get the real data
      const submissionsResponse = await axios.get('/submissions').catch(() => ({ data: [] }));
      setSubmissions(submissionsResponse.data);
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

  const openCreateAssignmentModal = () => {
    setCreateAssignmentForm({
      slug: '',
      title: '',
      description: '',
      details: ''
    });
    setTestFile(null);
    setShowCreateAssignment(true);
  };

  const closeCreateAssignmentModal = () => {
    setShowCreateAssignment(false);
    setCreateAssignmentForm({
      slug: '',
      title: '',
      description: '',
      details: ''
    });
    setTestFile(null);
  };

  const handleAssignmentFieldChange = (field, value) => {
    setCreateAssignmentForm((prev) => ({ ...prev, [field]: value }));
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    const trimmedSlug = createAssignmentForm.slug.trim();
    if (!trimmedSlug || !createAssignmentForm.title.trim()) {
      setStatusMessage({ type: 'error', text: 'Slug and title are required.' });
      return;
    }

    if (!testFile) {
      setStatusMessage({ type: 'error', text: 'Please upload a test file.' });
      return;
    }

    setSavingAssignment(true);
    setStatusMessage(null);
    try {
      const payload = new FormData();
      payload.append('slug', trimmedSlug);
      payload.append('title', createAssignmentForm.title.trim());
      payload.append('description', createAssignmentForm.description);
      payload.append('details', createAssignmentForm.details);
      payload.append('testFile', testFile);

      await axios.post('/assignments', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await hydrateData();
      setStatusMessage({ type: 'success', text: 'Assignment created successfully.' });
      closeCreateAssignmentModal();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create assignment.';
      setStatusMessage({ type: 'error', text: message });
    } finally {
      setSavingAssignment(false);
    }
  };


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
    <>
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

      {activeSection === 'assignments' && (
        <AssignmentsSection
          assignments={assignments}
          selectedAssignment={selectedAssignment}
          onSelectAssignment={setSelectedAssignment}
          onSubmit={submitAssignment}
          loading={loading}
          user={user}
          onCreateAssignment={openCreateAssignmentModal}
          submissions={submissions}
        />
      )}

      {activeSection === 'submissions' && (
        <SubmissionsSection submissions={submissions} assignments={assignments} />
      )}

      {activeSection === 'teacher' && user.role === 'teacher' && (
        <TeacherSection
          assignments={assignments}
          submissions={submissions}
        />
      )}
      </AppLayout>
      {showCreateAssignment && (
        <CreateAssignmentModal
          form={createAssignmentForm}
          onChangeField={handleAssignmentFieldChange}
          onSelectFile={setTestFile}
          testFile={testFile}
          onClose={closeCreateAssignmentModal}
          onSubmit={createAssignment}
          saving={savingAssignment}
        />
      )}
    </>
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

function AssignmentsSection({
  assignments,
  selectedAssignment,
  onSelectAssignment,
  onSubmit,
  loading,
  user,
  onCreateAssignment,
  submissions
}) {
  const [file, setFile] = useState(null);
  const [localMessage, setLocalMessage] = useState(null);

  useEffect(() => {
    if (!selectedAssignment && assignments.length) {
      onSelectAssignment(assignments[0]);
    }
  }, [assignments, selectedAssignment, onSelectAssignment]);

  // Calculate submission count for selected assignment
  const submissionCount = selectedAssignment 
    ? submissions.filter(s => s.assignmentId === selectedAssignment.id).length
    : 0;
  const canSubmit = submissionCount < 2;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !selectedAssignment) {
      setLocalMessage({ type: 'error', text: 'Select an assignment and upload a ZIP file.' });
      return;
    }

    if (!canSubmit) {
      setLocalMessage({ type: 'error', text: 'Maximum submission limit reached. You can only submit 2 times per assignment.' });
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
    <div className={user?.role === 'teacher' ? '' : 'two-column'}>
      <div className="card assignments-list">
        <h2 style={{ margin: '0 0 1rem 0' }}>Assignments</h2>
        {user?.role === 'teacher' && onCreateAssignment && (
          <div style={{ marginBottom: '1.5rem' }}>
            <PrimaryButton onClick={onCreateAssignment}>
              + Create assignment
            </PrimaryButton>
          </div>
        )}
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

      {user?.role !== 'teacher' && (
        <div className="card submission-panel">
          {selectedAssignment ? (
            <>
              <header>
                <h2>{selectedAssignment.title}</h2>
                <p>{selectedAssignment.description}</p>
              </header>
              {Array.isArray(selectedAssignment.details) && selectedAssignment.details.length > 0 && (
                <div className="assignment-brief">
                  <h3>Assignment brief</h3>
                  <ul>
                    {selectedAssignment.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="submission-guidelines">
                <h3>Submission guidelines</h3>
                <ul>
                  <li>Package your solution in a single ZIP file.</li>
                  <li>Ensure your main entry point matches the assignment requirements.</li>
                  <li>Include documentation or README if necessary.</li>
                  <li><strong>Important:</strong> You can submit a maximum of 2 times per assignment.</li>
                </ul>
                {submissionCount > 0 && (
                  <p style={{ marginTop: '0.75rem', color: submissionCount >= 2 ? '#dc2626' : '#64748b', fontWeight: submissionCount >= 2 ? 'bold' : 'normal' }}>
                    {submissionCount >= 2 
                      ? '⚠️ Maximum submission limit reached (2/2). You cannot submit again for this assignment.'
                      : `Submissions used: ${submissionCount}/2`
                    }
                  </p>
                )}
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
                <PrimaryButton type="submit" disabled={loading || !canSubmit}>
                  {loading ? 'Submitting…' : canSubmit ? 'Submit assignment' : 'Submission limit reached'}
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
      )}
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
            <span>Score</span>
            <span>File</span>
          </div>
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-table-row">
              <span>{lookupTitle(submission.assignmentId)}</span>
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
              <StatusPill submission={submission} />
              <span>
                {submission.score !== undefined && submission.score !== null ? (
                  <strong>{Math.round(submission.score * 100)}%</strong>
                ) : (
                  <span style={{ color: '#999' }}>—</span>
                )}
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
  const lookupTitle = (assignmentId) =>
    assignments.find((assignment) => assignment.id === assignmentId)?.title || 'Assignment';
  
  // Calculate unique students
  const uniqueStudents = new Set(submissions.map(s => s.userEmail || s.userId)).size;
  const totalAssignments = assignments.length;
  const totalSubmissions = submissions.length;

  return (
    <div className="space-y">
      <section className="stat-grid teacher-header">
        <div className="stat-card">
          <h3>Active students</h3>
          <p className="stat-value">{uniqueStudents}</p>
          <span>Students with submissions</span>
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

      <section className="card">
        <h2>All submissions</h2>
        <p>View and monitor all student submissions across all assignments.</p>

        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Student submissions will appear here once they submit their assignments."
          />
        ) : (
          <div className="submission-table">
            <div className="submission-table-header">
              <span>Student</span>
              <span>Assignment</span>
              <span>Submitted</span>
              <span>Status</span>
              <span>Score</span>
              <span>File</span>
            </div>
            {submissions.map((submission) => (
              <div key={submission.id} className="submission-table-row">
                <span>{submission.userEmail || `User #${submission.userId}`}</span>
                <span>{lookupTitle(submission.assignmentId)}</span>
                <span>{new Date(submission.createdAt).toLocaleString()}</span>
                <StatusPill submission={submission} />
                <span>
                  {submission.score !== undefined && submission.score !== null ? (
                    <strong>{Math.round(submission.score * 100)}%</strong>
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  )}
                </span>
                <span>{submission.filename}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <header className="modal-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function CreateAssignmentModal({ form, onChangeField, onSelectFile, testFile, onSubmit, onClose, saving }) {
  return (
    <Modal title="Create assignment" onClose={onClose}>
      <form className="modal-form" onSubmit={onSubmit}>
        <label>
          Slug
          <input
            type="text"
            value={form.slug}
            onChange={(event) => onChangeField('slug', event.target.value)}
            placeholder="e.g. even-number-check"
            required
          />
        </label>

        <label>
          Title
          <input
            type="text"
            value={form.title}
            onChange={(event) => onChangeField('title', event.target.value)}
            required
          />
        </label>

        <label>
          Description
          <input
            type="text"
            value={form.description}
            onChange={(event) => onChangeField('description', event.target.value)}
            placeholder="Short summary shown to students"
          />
        </label>

        <label>
          Details
          <textarea
            rows={4}
            value={form.details}
            onChange={(event) => onChangeField('details', event.target.value)}
            placeholder="One requirement per line"
          />
        </label>

        <label>
          Test file (.py)
          <input
            type="file"
            accept=".py"
            onChange={(event) => onSelectFile(event.target.files?.[0] || null)}
            required
          />
          {testFile && <span className="file-hint">{testFile.name}</span>}
        </label>
        <small style={{ color: '#475569' }}>
          Upload the pytest file used to grade submissions. Students cannot see this file.
        </small>

        <div className="modal-actions">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create assignment'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

function StatusPill({ submission }) {
  const { label, className } = getSubmissionStatusInfo(submission);
  return <span className={`status-pill ${className}`}>{label}</span>;
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







