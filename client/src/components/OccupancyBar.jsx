/**
 * OccupancyBar.jsx
 * Shows a per-day occupancy summary: booked / total seats, with a fill bar.
 */
export default function OccupancyBar({ weekDates, bookings, totalSeats = 50 }) {
    const countByDate = {}
    bookings.forEach((b) => {
        countByDate[b.date] = (countByDate[b.date] || 0) + 1
    })

    const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

    return (
        <div className="occupancy-bar-wrap">
            <span className="occ-label">Seat occupancy this week</span>
            <div className="occ-days">
                {weekDates.map((date, i) => {
                    const count = countByDate[date] || 0
                    const pct = Math.round((count / totalSeats) * 100)
                    const color = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#22c55e'
                    return (
                        <div key={date} className="occ-day">
                            <span className="occ-day-name">{DAY_SHORT[i]}</span>
                            <div className="occ-track">
                                <div className="occ-fill" style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <span className="occ-count">{count}/{totalSeats}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
