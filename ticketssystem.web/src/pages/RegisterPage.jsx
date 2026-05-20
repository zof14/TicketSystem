import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../api/axios'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await axios.post(`${API_URL}/auth/register`, form)
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
            <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required />
          </div>
          <div className="col">
            <label className="form-label">Last Name</label>
            <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required />
          </div>
        </div>
        <div className="mb-2">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Password <span className="text-muted small">(min 6 chars)</span></label>
          <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
        </div>
        <div className="mb-3">
          <label className="form-label">Phone Number <span className="text-muted small">(optional)</span></label>
          <input className="form-control" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
        </div>
        <button className="btn btn-primary w-100" type="submit">Register</button>
      </form>
      <p className="mt-3 text-center">If you have an account: <Link to="/login">Login</Link></p>
    </div>
  )
}
