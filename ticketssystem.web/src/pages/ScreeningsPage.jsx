import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../api/axios'

export default function ScreeningsPage() {
  const [screenings, setScreenings] = useState([])

  useEffect(() => {
    axios.get(`${API_URL}/screenings`).then(res => setScreenings(res.data))
  }, [])

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Upcoming Screenings</h2>
      {screenings.length === 0 && <p className="text-muted">No screenings planned.</p>}
      <div className="row row-cols-1 row-cols-md-3 g-3">
        {screenings.map(s => (
          <div className="col" key={s.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{s.filmTitle}</h5>
                <p className="card-text mb-1"><strong>Cinema:</strong> {s.cinemaName}</p>
                <p className="card-text mb-1"><strong>Room:</strong> {s.cinemaRows} rows and {s.cinemaSeatsPerRow} seats</p>
                <p className="card-text"><strong>Start time:</strong> {new Date(s.startTime).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
