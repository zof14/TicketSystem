import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../api/axios'

export default function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', rowVersion: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(null)

  useEffect(() => {
    createApi(user.token).get('/users/me').then(res => {
      const d = res.data
      setForm({ firstName: d.firstName ?? '', lastName: d.lastName ?? '', phoneNumber: d.phoneNumber ?? '', rowVersion: d.rowVersion })
    })
  }, [user.token])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setConflict(null)
    try {
      const res = await createApi(user.token).put('/users/me', form)
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
    setForm({
      firstName: conflict.firstName ?? '',
      lastName: conflict.lastName ?? '',
      phoneNumber: conflict.phoneNumber ?? '',
      rowVersion: conflict.rowVersion
    })
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
          <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Last Name</label>
          <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone Number</label>
          <input className="form-control" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </div>
        <button className="btn btn-primary" type="submit">Save Changes</button>
      </form>
    </div>
  )
}
