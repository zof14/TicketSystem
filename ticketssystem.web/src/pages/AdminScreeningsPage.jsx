import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createApi } from '../api/axios'

export default function AdminScreeningsPage() {
  const { user } = useAuth()
  const [screenings, setScreenings] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [form, setForm] = useState({ cinemaId: '', filmTitle: '', startTime: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadAll = async () => {
    const [sc, ci] = await Promise.all([
      createApi(user.token).get('/screenings'),
      createApi(user.token).get('/cinemas')
    ])
    setScreenings(sc.data)
    setCinemas(ci.data)
    if (ci.data.length > 0 && !form.cinemaId) {
      setForm(f => ({ ...f, cinemaId: String(ci.data[0].id) }))
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      await createApi(user.token).post('/screenings', {
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
    setError('')
    setMessage('')
    try {
      await createApi(user.token).delete(`/screenings/${id}`)
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
              <select className="form-select" name="cinemaId" value={form.cinemaId} onChange={handleChange} required>
                {cinemas.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.rows}×{c.seatsPerRow})</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Film Title</label>
              <input className="form-control" name="filmTitle" value={form.filmTitle} onChange={handleChange} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Start Date & Time</label>
              <input className="form-control" type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-success w-100" type="submit">Add</button>
            </div>
          </form>
        </div>
      </div>

      <table className="table table-striped table-hover">
        <thead style={{ backgroundColor: '#6f42c1', color: 'white' }}>
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
