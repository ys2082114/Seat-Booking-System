/**
 * SeatGrid.jsx
 * Renders a table: rows = seats, columns = Mon–Fri of the selected week.
 * Color rules:
 *   🟢 seat-available  — designated seat, it's the user's designated day, nobody booked it
 *   🟡 seat-floater    — floater seat, it's the user's non-designated day, nobody booked it
 *   🔵 seat-mine       — booked by the current user
 *   ⚫ seat-taken       — booked by someone else
 *   🔴 seat-blocked    — weekend / holiday / wrong-batch day (no booking possible)
 */
import { useMemo } from 'react'

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

/** Get ISO week number for a Date */
function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function getWeekType(date) {
    return getISOWeek(date) % 2 !== 0 ? 'WEEK_1' : 'WEEK_2'
}

/** Days batch is DESIGNATED for */
function batchDesignatedDays(batch, weekType) {
    if (batch === 'A') return weekType === 'WEEK_1' ? [1, 2, 3] : [4, 5]
    return weekType === 'WEEK_1' ? [4, 5] : [1, 2, 3]
}

/** Parse YYYY-MM-DD → UTC midnight Date */
function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d))
}

/** Normalize an id value to string for reliable comparison */
function strId(val) {
    if (!val) return ''
    if (typeof val === 'object' && val._id) return String(val._id)
    return String(val)
}

export default function SeatGrid({ seats, bookings, weekDates, user, onBook, onRelease, canBook, actionLoading }) {
    const weekType = weekDates.length ? getWeekType(parseDate(weekDates[0])) : 'WEEK_1'
    const designatedDays = batchDesignatedDays(user.batch, weekType)

    // Normalize the current user's id — server may return _id or id
    const myId = strId(user._id || user.id)

    /** Build a lookup: `${seatId}_${date}` → booking */
    const bookingMap = useMemo(() => {
        const map = {}
        bookings.forEach((b) => {
            const sid = strId(b.seatId?._id || b.seatId)
            map[`${sid}_${b.date}`] = b
        })
        return map
    }, [bookings])

    function getCellInfo(seat, dateStr) {
        const dateObj = parseDate(dateStr)
        const dow = dateObj.getUTCDay() // 0=Sun…6=Sat
        const booking = bookingMap[`${strId(seat._id)}_${dateStr}`]

        // Seat disabled by admin (maintenance)
        if (seat.isActive === false) {
            return { cls: 'seat-blocked', label: '🔧', tooltip: 'Seat unavailable (maintenance)', clickable: false }
        }

        // Already booked by this user
        if (booking && strId(booking.userId?._id || booking.userId) === myId) {
            return {
                cls: 'seat-mine',
                label: '✓',
                tooltip: 'Your booking — click to release',
                clickable: !actionLoading,
                action: 'release',
                bookingId: booking._id,
            }
        }
        // Booked by someone else
        if (booking) {
            const bookedBy = booking.userId?.name || 'Someone'
            return { cls: 'seat-taken', label: '✗', tooltip: `Booked by ${bookedBy}`, clickable: false }
        }
        // Weekend
        if (dow === 0 || dow === 6) {
            return { cls: 'seat-blocked', label: '–', tooltip: 'Weekend — no booking', clickable: false }
        }

        const isDesignatedDay = designatedDays.includes(dow)

        if (seat.type === 'designated') {
            if (!isDesignatedDay) {
                return { cls: 'seat-blocked', label: '–', tooltip: `Batch ${user.batch} designated seats not available today`, clickable: false }
            }
            return {
                cls: 'seat-available',
                label: '○',
                tooltip: canBook ? 'Click to book' : 'Bookable after 3 PM IST',
                clickable: canBook && !actionLoading,
                action: 'book',
            }
        }

        // Floater seat — available on NON-designated days only
        if (isDesignatedDay) {
            return { cls: 'seat-blocked', label: '–', tooltip: 'Floater seats not available on your designated days', clickable: false }
        }
        return {
            cls: 'seat-floater',
            label: '◈',
            tooltip: canBook ? 'Floater seat — click to book' : 'Bookable after 3 PM IST',
            clickable: canBook && !actionLoading,
            action: 'book',
        }
    }

    if (!seats.length) return <div className="loading">Loading seats…</div>

    return (
        <div className={`grid-wrapper ${actionLoading ? 'grid-busy' : ''}`}>
            <table>
                <thead>
                    <tr>
                        <th>Seat</th>
                        {weekDates.map((d, i) => (
                            <th key={d}>
                                {DAY_LABELS[i]}<br />
                                <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>{d}</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {seats.map((seat) => (
                        <tr key={seat._id}>
                            <td>
                                #{seat.seatNumber}&nbsp;
                                <span style={{ color: seat.type === 'floater' ? '#ca8a04' : '#64748b', fontSize: '0.7rem' }}>
                                    {seat.type === 'floater' ? 'F' : 'D'}
                                </span>
                            </td>
                            {weekDates.map((dateStr) => {
                                const info = getCellInfo(seat, dateStr)
                                const handleClick = () => {
                                    if (!info.clickable) return
                                    if (info.action === 'book') onBook(seat._id, dateStr)
                                    if (info.action === 'release') onRelease(info.bookingId)
                                }
                                return (
                                    <td key={dateStr}>
                                        <div
                                            className={`seat-cell ${info.cls} ${info.clickable ? 'clickable' : ''}`}
                                            data-tooltip={info.tooltip}
                                            onClick={handleClick}
                                            title={info.tooltip}
                                        >
                                            {info.label}
                                        </div>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
