import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

/**
 * AdminPanel.jsx
 * Visible ONLY to users with role === 'ADMIN'.
 * Two collapsible sections:
 *   1. All Bookings — read-only table + force-release per row
 *   2. Seat Management — disable / enable individual seats
 */
export default function AdminPanel({ onRefreshSeats }) {
    const [bookingsOpen, setBookingsOpen] = useState(false)
    const [seatsOpen, setSeatsOpen] = useState(false)

    // ── All Bookings ──────────────────────────────────────
    const [bookings, setBookings] = useState([])
    const [bookingsLoading, setBookingsLoading] = useState(false)

    const fetchAllBookings = useCallback(async () => {
        setBookingsLoading(true)
        try {
            const { data } = await api.get('/admin/bookings')
            setBookings(data)
        } catch {
            setBookings([])
        } finally {
            setBookingsLoading(false)
        }
    }, [])

    useEffect(() => { if (bookingsOpen) fetchAllBookings() }, [bookingsOpen, fetchAllBookings])

    const handleForceRelease = async (id) => {
        if (!window.confirm('Force-release this booking?')) return
        try {
            await api.delete(`/admin/bookings/${id}`)
            fetchAllBookings()
            if (onRefreshSeats) onRefreshSeats()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to release.')
        }
    }

    // ── Seat Management ───────────────────────────────────
    const [seats, setSeats] = useState([])
    const [seatsLoading, setSeatsLoading] = useState(false)

    const fetchSeats = useCallback(async () => {
        setSeatsLoading(true)
        try {
            const { data } = await api.get('/seats')
            setSeats(data)
        } catch {
            setSeats([])
        } finally {
            setSeatsLoading(false)
        }
    }, [])

    useEffect(() => { if (seatsOpen) fetchSeats() }, [seatsOpen, fetchSeats])

    const toggleSeat = async (seat) => {
        const action = seat.isActive ? 'disable' : 'enable'
        try {
            await api.patch(`/admin/seats/${seat._id}/${action}`)
            fetchSeats()
            if (onRefreshSeats) onRefreshSeats()
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${action} seat.`)
        }
    }

    return (
        <div className="admin-panel-wrap">
            <div className="admin-panel-header">
                🛡️ Admin Panel
            </div>

            {/* ── All Bookings ── */}
            <div className="my-bookings-wrap" style={{ marginTop: '0.5rem' }}>
                <button className="mybookings-toggle" onClick={() => setBookingsOpen(o => !o)}>
                    📋 All Bookings {bookingsOpen ? '▲' : '▼'}
                </button>
                {bookingsOpen && (
                    <div className="mybookings-panel">
                        {bookingsLoading ? (
                            <p className="mb-hint">Loading…</p>
                        ) : bookings.length === 0 ? (
                            <p className="mb-hint">No bookings found.</p>
                        ) : (
                            <table className="mb-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>User</th>
                                        <th>Batch</th>
                                        <th>Seat</th>
                                        <th>Type</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b._id}>
                                            <td>{b.date}</td>
                                            <td>{b.userId?.name || '—'}</td>
                                            <td>
                                                <span className={`badge badge-${b.userId?.batch?.toLowerCase()}`}>
                                                    {b.userId?.batch}
                                                </span>
                                            </td>
                                            <td>#{b.seatId?.seatNumber}</td>
                                            <td>
                                                <span className={`type-badge ${b.seatId?.type === 'floater' ? 'type-floater' : 'type-designated'}`}>
                                                    {b.seatId?.type === 'floater' ? 'F' : 'D'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-release-sm"
                                                    onClick={() => handleForceRelease(b._id)}
                                                >
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

            {/* ── Seat Management ── */}
            <div className="my-bookings-wrap" style={{ marginTop: '0.5rem' }}>
                <button className="mybookings-toggle" onClick={() => setSeatsOpen(o => !o)}>
                    💺 Seat Management {seatsOpen ? '▲' : '▼'}
                </button>
                {seatsOpen && (
                    <div className="mybookings-panel">
                        {seatsLoading ? (
                            <p className="mb-hint">Loading…</p>
                        ) : (
                            <table className="mb-table">
                                <thead>
                                    <tr>
                                        <th>Seat</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {seats.map((s) => (
                                        <tr key={s._id}>
                                            <td>#{s.seatNumber}</td>
                                            <td>
                                                <span className={`type-badge ${s.type === 'floater' ? 'type-floater' : 'type-designated'}`}>
                                                    {s.type === 'floater' ? 'Floater' : 'Designated'}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: s.isActive !== false ? '#22c55e' : '#ef4444',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {s.isActive !== false ? '● Active' : '● Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-release-sm"
                                                    style={{
                                                        background: s.isActive !== false
                                                            ? 'rgba(239,68,68,0.15)'
                                                            : 'rgba(34,197,94,0.15)',
                                                        color: s.isActive !== false ? '#ef4444' : '#22c55e',
                                                    }}
                                                    onClick={() => toggleSeat(s)}
                                                >
                                                    {s.isActive !== false ? 'Disable' : 'Enable'}
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
        </div>
    )
}
