import { useNavigate } from 'react-router-dom'

export default function Navbar() {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/auth')
    }

    return (
        <nav className="navbar">
            <span className="navbar-brand">🪑 Seat Booking System</span>
            <span className="navbar-info">
                Logged in as <span>{user.name}</span> — Batch&nbsp;
                <span className={`badge badge-${user.batch?.toLowerCase()}`}>{user.batch}</span>
            </span>
            <button className="btn-logout" onClick={handleLogout}>
                Logout
            </button>
        </nav>
    )
}
