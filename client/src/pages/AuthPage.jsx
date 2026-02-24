import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function AuthPage() {
    const navigate = useNavigate()
    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [form, setForm] = useState({ name: '', email: '', password: '', batch: 'A' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
            const payload =
                mode === 'login'
                    ? { email: form.email, password: form.password }
                    : { name: form.name, email: form.email, password: form.password, batch: form.batch }

            const { data } = await api.post(endpoint, payload)
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <h2>🪑 {mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Alice"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label>Batch</label>
                            <select name="batch" value={form.batch} onChange={handleChange}>
                                <option value="A">Batch A</option>
                                <option value="B">Batch B</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Register'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {mode === 'login' ? (
                        <>
                            Don't have an account?{' '}
                            <button onClick={() => { setMode('register'); setError('') }}>Register</button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => { setMode('login'); setError('') }}>Sign In</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
