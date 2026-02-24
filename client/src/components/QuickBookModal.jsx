import { useState, useEffect } from 'react'
import api from '../services/api'

/** Parse YYYY-MM-DD → UTC Date */
function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d))
}

function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function batchDesignatedDays(batch, weekType) {
    if (batch === 'A') return weekType === 'WEEK_1' ? [1, 2, 3] : [4, 5]
    return weekType === 'WEEK_1' ? [4, 5] : [1, 2, 3]
}

/** Get next working day after 3 PM IST */
function getNextWorkingDay() {
    const now = new Date()
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    if (istNow.getUTCHours() < 15) return null
    let candidate = new Date(now)
    candidate.setUTCHours(0, 0, 0, 0)
    candidate.setUTCDate(candidate.getUTCDate() + 1)
    while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
        candidate.setUTCDate(candidate.getUTCDate() + 1)
    }
    return candidate.toISOString().split('T')[0]
}

export default function QuickBookModal({ seats, bookings, user, onBook, onClose }) {
    const nextDay = getNextWorkingDay()
    const [selectedSeat, setSelectedSeat] = useState('')
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')
    const [success, setSuccess] = useState('')

    if (!nextDay) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>⚡ Quick Book</h3>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <p className="qb-note">Booking opens after <strong>3:00 PM IST</strong>. Come back later!</p>
                </div>
            </div>
        )
    }

    const dateObj = parseDate(nextDay)
    const dow = dateObj.getUTCDay()
    const weekType = getISOWeek(dateObj) % 2 !== 0 ? 'WEEK_1' : 'WEEK_2'
    const designatedDays = batchDesignatedDays(user.batch, weekType)
    const isDesignatedDay = designatedDays.includes(dow)

    // Bookings already made for that day
    const bookedSeatIds = new Set(
        bookings.filter((b) => b.date === nextDay).map((b) => String(b.seatId?._id || b.seatId))
    )

    // Filter eligible seats
    const eligibleSeats = seats.filter((s) => {
        if (bookedSeatIds.has(String(s._id))) return false
        if (s.type === 'designated') return isDesignatedDay
        return !isDesignatedDay
    })

    const handleBook = async () => {
        if (!selectedSeat) { setErr('Please select a seat.'); return }
        setLoading(true); setErr(''); setSuccess('')
        try {
            await onBook(selectedSeat, nextDay)
            setSuccess(`✅ Seat booked for ${nextDay}!`)
            setSelectedSeat('')
        } catch (e) {
            setErr(e?.response?.data?.message || 'Booking failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚡ Quick Book</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <p className="qb-note">
                    Booking for <strong>{nextDay}</strong> ({isDesignatedDay ? 'Designated day' : 'Floater day'} for Batch {user.batch})
                </p>

                {eligibleSeats.length === 0 ? (
                    <p className="qb-empty">No eligible seats available for this day.</p>
                ) : (
                    <>
                        <div className="qb-seat-grid">
                            {eligibleSeats.map((s) => (
                                <button
                                    key={s._id}
                                    className={`qb-seat-btn ${selectedSeat === s._id ? 'qb-selected' : ''} ${s.type === 'floater' ? 'qb-floater' : 'qb-designated'}`}
                                    onClick={() => setSelectedSeat(s._id)}
                                >
                                    #{s.seatNumber}
                                    <span className="qb-type">{s.type === 'floater' ? 'F' : 'D'}</span>
                                </button>
                            ))}
                        </div>
                        {err && <p className="qb-err">{err}</p>}
                        {success && <p className="qb-success">{success}</p>}
                        <button
                            className="btn-primary qb-confirm"
                            onClick={handleBook}
                            disabled={loading || !selectedSeat}
                        >
                            {loading ? 'Booking…' : `Book Seat ${eligibleSeats.find(s => s._id === selectedSeat)?.seatNumber || ''}`}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
