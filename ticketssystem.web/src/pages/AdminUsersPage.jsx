import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../api/axios'

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(null)

  const loadUsers = () => {
    createApi(user.token).get('/users').then(res => setUsers(res.data))
  }

  useEffect(() => { loadUsers() }, [])

  const startEdit = (u) => {
    setEditing({ id: u.id, firstName: u.firstName ?? '', lastName: u.lastName ?? '', phoneNumber: u.phoneNumber ?? '', rowVersion: u.rowVersion })
    setConflict(null)
    setError('')
    setMessage('')
  }

  const handleEditChange = (e) => {
    setEditing({ ...editing, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setConflict(null)
    try {
      await createApi(user.token).put(`/users/${editing.id}`, {
        firstName: editing.firstName,
        lastName: editing.lastName,
        phoneNumber: editing.phoneNumber,
        rowVersion: editing.rowVersion
      })
      setMessage('User updated.')
      setEditing(null)
      loadUsers()
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict(err.response.data.current)
      } else {
        setError('Update failed.')
      }
    }
  }

  const loadConflict = () => {
    setEditing({
      ...editing,
      firstName: conflict.firstName ?? '',
      lastName: conflict.lastName ?? '',
      phoneNumber: conflict.phoneNumber ?? '',
      rowVersion: conflict.rowVersion
    })
    setConflict(null)
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.email}? This cannot be undone.`)) return
    setError('')
    setMessage('')
    try {
      await createApi(user.token).delete(`/users/${u.id}?rowVersion=${encodeURIComponent(u.rowVersion)}`)
      setMessage('User deleted.')
      loadUsers()
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Conflict: this user was modified by someone else. The list has been refreshed.')
        loadUsers()
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
                <input className="form-control" placeholder="First name" name="firstName" value={editing.firstName} onChange={handleEditChange} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Last name" name="lastName" value={editing.lastName} onChange={handleEditChange} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Phone" name="phoneNumber" value={editing.phoneNumber} onChange={handleEditChange} />
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
