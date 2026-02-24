import { useState, useEffect } from 'react'
import api from '../services/api'

const today = new Date().toISOString().split('T')[0]

export default function MyBookings({ onRelease }) {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    const fetchMyBookings = async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/my-bookings')
            // Only show upcoming or today's bookings
            const upcoming = data.filter((b) => b.date >= today)
            setBookings(upcoming)
        } catch {
            setBookings([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) fetchMyBookings()
    }, [open])

    const handleRelease = async (id) => {
        if (!window.confirm('Release this booking?')) return
        try {
            await api.delete(`/bookings/${id}`)
            fetchMyBookings()
            if (onRelease) onRelease()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to release.')
        }
    }

    return (
        <div className="my-bookings-wrap">
            <button className="mybookings-toggle" onClick={() => setOpen((o) => !o)}>
                📋 My Bookings {bookings.length > 0 && !open ? <span className="badge-count">{bookings.length}</span> : ''} {open ? '▲' : '▼'}
            </button>

            {open && (
                <div className="mybookings-panel">
                    {loading ? (
                        <p className="mb-hint">Loading…</p>
                    ) : bookings.length === 0 ? (
                        <p className="mb-hint">No upcoming bookings.</p>
                    ) : (
                        <table className="mb-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Seat</th>
                                    <th>Type</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b._id}>
                                        <td>{b.date}</td>
                                        <td>#{b.seatId?.seatNumber}</td>
                                        <td>
                                            <span className={`type-badge ${b.seatId?.type === 'floater' ? 'type-floater' : 'type-designated'}`}>
                                                {b.seatId?.type === 'floater' ? 'Floater' : 'Designated'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-release-sm" onClick={() => handleRelease(b._id)}>
                                                Release
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    )
}
