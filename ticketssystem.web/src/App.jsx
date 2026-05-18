import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import 'bootstrap/dist/css/bootstrap.min.css'

const API = 'http://localhost:5109/api'

// ── Auth context ──────────────────────────────────────────────────────────────

const AuthCtx = createContext(null)
function useAuth() { return useContext(AuthCtx) }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const login = (data) => { localStorage.setItem('user', JSON.stringify(data)); setUser(data) }
  const logout = () => { localStorage.removeItem('user'); setUser(null) }

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>
}

// Axios instance with Bearer token attached
function api(token) {
  return axios.create({
    baseURL: API,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
}

// Route guard
function Protected({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !user.roles?.includes('Admin')) return <Navigate to="/" replace />
  return children
}

// ── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }
  const isAdmin = user?.roles?.includes('Admin')

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand fw-bold" to="/">🎬 CinemaApp</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="nav">
        <ul className="navbar-nav me-auto">
          <li className="nav-item"><Link className="nav-link" to="/">Screenings</Link></li>
          {user && <li className="nav-item"><Link className="nav-link" to="/profile">My Profile</Link></li>}
          {isAdmin && <>
            <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/admin/screenings">Manage Screenings</Link></li>
          </>}
        </ul>
        <ul className="navbar-nav">
          {user ? (
            <li className="nav-item d-flex align-items-center gap-2">
              <span className="text-light small">{user.email} {isAdmin && <span className="badge bg-warning text-dark">Admin</span>}</span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
            </li>
          ) : <>
            <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
          </>}
        </ul>
      </div>
    </nav>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password })
      login(res.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    }
  }

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2 className="mb-4">Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input className="form-control" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary w-100" type="submit">Login</button>
      </form>
      <p className="mt-3 text-center">No account? <Link to="/register">Register</Link></p>
    </div>
  )
}

// ── Register ──────────────────────────────────────────────────────────────────

function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await axios.post(`${API}/auth/register`, form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const errors = err.response?.data
      if (Array.isArray(errors)) {
        setError(errors.map(e => e.description).join(' '))
      } else {
        setError('Registration failed.')
      }
    }
  }

  return (
    <div className="container mt-5" style={{ maxWidth: 450 }}>
      <h2 className="mb-4">Register</h2>
      {success && <div className="alert alert-success">Registered! Redirecting to login…</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-2 mb-2">
          <div className="col">
            <label className="form-label">First Name</label>
            <input className="form-control" value={form.firstName} onChange={set('firstName')} required />
          </div>
          <div className="col">
            <label className="form-label">Last Name</label>
            <input className="form-control" value={form.lastName} onChange={set('lastName')} required />
          </div>
        </div>
        <div className="mb-2">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Password <span className="text-muted small">(min 6 chars)</span></label>
          <input className="form-control" type="password" value={form.password} onChange={set('password')} required minLength={6} />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone Number <span className="text-muted small">(optional)</span></label>
          <input className="form-control" value={form.phoneNumber} onChange={set('phoneNumber')} />
        </div>
        <button className="btn btn-primary w-100" type="submit">Register</button>
      </form>
      <p className="mt-3 text-center">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}

// ── Profile (edit own) ────────────────────────────────────────────────────────

function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', rowVersion: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(null)

  useEffect(() => {
    api(user.token).get('/users/me').then(res => {
      const d = res.data
      setForm({ firstName: d.firstName ?? '', lastName: d.lastName ?? '', phoneNumber: d.phoneNumber ?? '', rowVersion: d.rowVersion })
    })
  }, [user.token])

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMessage(''); setConflict(null)
    try {
      const res = await api(user.token).put('/users/me', form)
      setForm(f => ({ ...f, rowVersion: res.data.rowVersion }))
      setMessage('Profile updated successfully!')
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict(err.response.data.current)
      } else {
        setError('Failed to update profile.')
      }
    }
  }

  const loadConflict = () => {
    setForm({ firstName: conflict.firstName ?? '', lastName: conflict.lastName ?? '', phoneNumber: conflict.phoneNumber ?? '', rowVersion: conflict.rowVersion })
    setConflict(null)
  }

  return (
    <div className="container mt-5" style={{ maxWidth: 450 }}>
      <h2 className="mb-4">My Profile</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {conflict && (
        <div className="alert alert-warning">
          <strong>Conflict!</strong> Someone else modified your profile while you were editing.
          <br />Current server values: <em>{conflict.firstName} {conflict.lastName}</em>, phone: <em>{conflict.phoneNumber}</em>
          <br />
          <button className="btn btn-sm btn-warning mt-2" onClick={loadConflict}>Load current values and retry</button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">First Name</label>
          <input className="form-control" value={form.firstName} onChange={set('firstName')} />
        </div>
        <div className="mb-3">
          <label className="form-label">Last Name</label>
          <input className="form-control" value={form.lastName} onChange={set('lastName')} />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input className="form-control" value={form.phoneNumber} onChange={set('phoneNumber')} />
        </div>
        <button className="btn btn-primary" type="submit">Save Changes</button>
      </form>
    </div>
  )
}

// ── Admin: Users ──────────────────────────────────────────────────────────────

function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(null)

  const load = () => api(user.token).get('/users').then(res => setUsers(res.data))
  useEffect(() => { load() }, [])

  const startEdit = (u) => {
    setEditing({ id: u.id, firstName: u.firstName ?? '', lastName: u.lastName ?? '', phoneNumber: u.phoneNumber ?? '', rowVersion: u.rowVersion })
    setConflict(null); setError(''); setMessage('')
  }

  const setEditField = field => e => setEditing(ed => ({ ...ed, [field]: e.target.value }))

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError(''); setConflict(null)
    try {
      await api(user.token).put(`/users/${editing.id}`, {
        firstName: editing.firstName,
        lastName: editing.lastName,
        phoneNumber: editing.phoneNumber,
        rowVersion: editing.rowVersion
      })
      setMessage('User updated.')
      setEditing(null)
      load()
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict(err.response.data.current)
      } else {
        setError('Update failed.')
      }
    }
  }

  const loadConflict = () => {
    setEditing(ed => ({ ...ed, firstName: conflict.firstName ?? '', lastName: conflict.lastName ?? '', phoneNumber: conflict.phoneNumber ?? '', rowVersion: conflict.rowVersion }))
    setConflict(null)
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.email}? This cannot be undone.`)) return
    setError(''); setMessage('')
    try {
      await api(user.token).delete(`/users/${u.id}?rowVersion=${encodeURIComponent(u.rowVersion)}`)
      setMessage('User deleted.')
      load()
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Conflict: this user was modified by someone else. The list has been refreshed.')
        load()
      } else {
        setError('Delete failed.')
      }
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Manage Users</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {editing && (
        <div className="card mb-4 border-primary">
          <div className="card-header bg-primary text-white">Editing user</div>
          <div className="card-body">
            {conflict && (
              <div className="alert alert-warning">
                <strong>Conflict!</strong> This user was modified by someone else.
                Server values: <em>{conflict.firstName} {conflict.lastName}</em>, phone: <em>{conflict.phoneNumber}</em>
                <button className="btn btn-sm btn-warning ms-2" onClick={loadConflict}>Load & retry</button>
              </div>
            )}
            <form onSubmit={handleUpdate} className="row g-2">
              <div className="col-md-4">
                <input className="form-control" placeholder="First name" value={editing.firstName} onChange={setEditField('firstName')} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Last name" value={editing.lastName} onChange={setEditField('lastName')} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Phone" value={editing.phoneNumber} onChange={setEditField('phoneNumber')} />
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-success" type="submit">Save</button>
                <button className="btn btn-secondary" type="button" onClick={() => { setEditing(null); setConflict(null) }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr><th>Email</th><th>First Name</th><th>Last Name</th><th>Phone</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.firstName}</td>
              <td>{u.lastName}</td>
              <td>{u.phoneNumber}</td>
              <td>
                <button className="btn btn-sm btn-primary me-2" onClick={() => startEdit(u)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Admin: Screenings ─────────────────────────────────────────────────────────

function AdminScreeningsPage() {
  const { user } = useAuth()
  const [screenings, setScreenings] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [form, setForm] = useState({ cinemaId: '', filmTitle: '', startTime: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadAll = async () => {
    const [sc, ci] = await Promise.all([
      api(user.token).get('/screenings'),
      api(user.token).get('/cinemas')
    ])
    setScreenings(sc.data)
    setCinemas(ci.data)
    if (ci.data.length > 0 && !form.cinemaId) {
      setForm(f => ({ ...f, cinemaId: String(ci.data[0].id) }))
    }
  }

  useEffect(() => { loadAll() }, [])

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    try {
      await api(user.token).post('/screenings', {
        cinemaId: parseInt(form.cinemaId),
        filmTitle: form.filmTitle,
        startTime: new Date(form.startTime).toISOString()
      })
      setMessage('Screening created.')
      setForm(f => ({ ...f, filmTitle: '', startTime: '' }))
      loadAll()
    } catch {
      setError('Failed to create screening.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this screening and all its reservations?')) return
    setError(''); setMessage('')
    try {
      await api(user.token).delete(`/screenings/${id}`)
      setMessage('Screening deleted.')
      loadAll()
    } catch {
      setError('Delete failed.')
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Manage Screenings</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="card-header fw-bold">Add New Screening</div>
        <div className="card-body">
          <form onSubmit={handleCreate} className="row g-2">
            <div className="col-md-3">
              <label className="form-label">Cinema</label>
              <select className="form-select" value={form.cinemaId} onChange={set('cinemaId')} required>
                {cinemas.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.rows}×{c.seatsPerRow})</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Film Title</label>
              <input className="form-control" placeholder="e.g. Inception" value={form.filmTitle} onChange={set('filmTitle')} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Start Date & Time</label>
              <input className="form-control" type="datetime-local" value={form.startTime} onChange={set('startTime')} required />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-success w-100" type="submit">Add</button>
            </div>
          </form>
        </div>
      </div>

      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr><th>Film</th><th>Cinema</th><th>Room Size</th><th>Start Time</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {screenings.length === 0 && (
            <tr><td colSpan={5} className="text-center text-muted">No screenings yet.</td></tr>
          )}
          {screenings.map(s => (
            <tr key={s.id}>
              <td>{s.filmTitle}</td>
              <td>{s.cinemaName}</td>
              <td>{s.cinemaRows} rows × {s.cinemaSeatsPerRow} seats</td>
              <td>{new Date(s.startTime).toLocaleString()}</td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Home: Screenings list (everyone) ──────────────────────────────────────────

function ScreeningsPage() {
  const [screenings, setScreenings] = useState([])

  useEffect(() => {
    axios.get(`${API}/screenings`).then(res => setScreenings(res.data))
  }, [])

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Upcoming Screenings</h2>
      {screenings.length === 0 && <p className="text-muted">No screenings available.</p>}
      <div className="row row-cols-1 row-cols-md-3 g-3">
        {screenings.map(s => (
          <div className="col" key={s.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{s.filmTitle}</h5>
                <p className="card-text mb-1"><strong>Cinema:</strong> {s.cinemaName}</p>
                <p className="card-text mb-1"><strong>Room:</strong> {s.cinemaRows} rows × {s.cinemaSeatsPerRow} seats</p>
                <p className="card-text"><strong>Starts:</strong> {new Date(s.startTime).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<ScreeningsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          <Route path="/admin/users" element={<Protected adminOnly><AdminUsersPage /></Protected>} />
          <Route path="/admin/screenings" element={<Protected adminOnly><AdminScreeningsPage /></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
