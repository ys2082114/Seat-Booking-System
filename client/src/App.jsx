import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import BookingPage from './pages/BookingPage'

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token')
    return token ? children : <Navigate to="/auth" replace />
}

export default function App() {
    return (
        <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <BookingPage />
                    </PrivateRoute>
                }
            />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
