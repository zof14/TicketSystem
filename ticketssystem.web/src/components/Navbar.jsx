import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.roles?.includes('Admin')

  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-3" style={{ backgroundColor: '#6f42c1' }}>
      <Link className="navbar-brand fw-bold" to="/">Cinema</Link>
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
              <span className="text-light small">{user.email}</span>
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
