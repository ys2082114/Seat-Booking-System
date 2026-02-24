import { useState, useEffect } from 'react'
import api from '../services/api'

export default function HolidayManager() {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    const isAdmin = currentUser.role === 'ADMIN'
    const [holidays, setHolidays] = useState([])
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState({ date: '', reason: '' })
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')
    const [msg, setMsg] = useState('')

    const fetchHolidays = async () => {
        try {
            const { data } = await api.get('/holidays')
            setHolidays(data)
        } catch {
            setHolidays([])
        }
    }

    useEffect(() => { if (open) fetchHolidays() }, [open])

    const handleAdd = async (e) => {
        e.preventDefault()
        setErr(''); setMsg('')
        if (!form.date || !form.reason) { setErr('Date and reason are required.'); return }
        setLoading(true)
        try {
            await api.post('/holidays', form)
            setMsg(`✅ Holiday added for ${form.date}.`)
            setForm({ date: '', reason: '' })
            fetchHolidays()
        } catch (ex) {
            setErr(ex.response?.data?.message || 'Failed to add holiday.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id, date) => {
        if (!window.confirm(`Remove holiday on ${date}?`)) return
        try {
            await api.delete(`/holidays/${id}`)
            setMsg(`✅ Holiday on ${date} removed.`)
            fetchHolidays()
        } catch (ex) {
            setErr(ex.response?.data?.message || 'Failed to remove.')
        }
    }

    return (
        <div className="holiday-wrap">
            <button className="mybookings-toggle" onClick={() => setOpen((o) => !o)}>
                🗓️ Manage Holidays {open ? '▲' : '▼'}
            </button>

            {open && (
                <div className="mybookings-panel">
                    {/* Add form — ADMIN only */}
                    {isAdmin && (
                        <form className="holiday-form" onSubmit={handleAdd}>
                            <input
                                type="date"
                                className="holiday-input"
                                value={form.date}
                                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                            />
                            <input
                                type="text"
                                className="holiday-input"
                                placeholder="Reason (e.g. Diwali)"
                                value={form.reason}
                                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                            />
                            <button className="btn-add-holiday" type="submit" disabled={loading}>
                                {loading ? 'Adding…' : '+ Add'}
                            </button>
                        </form>
                    )}
                    {err && <p className="qb-err">{err}</p>}
                    {msg && <p className="qb-success">{msg}</p>}

                    {/* Holiday list */}
                    {holidays.length === 0 ? (
                        <p className="mb-hint">No holidays configured.</p>
                    ) : (
                        <table className="mb-table" style={{ marginTop: '0.75rem' }}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Reason</th>
                                    {isAdmin && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {holidays.map((h) => (
                                    <tr key={h._id}>
                                        <td>{h.date}</td>
                                        <td>{h.reason}</td>
                                        {/* Remove button — ADMIN only */}
                                        {isAdmin && (
                                            <td>
                                                <button className="btn-release-sm" onClick={() => handleDelete(h._id, h.date)}>
                                                    Remove
                                                </button>
                                            </td>
                                        )}
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
