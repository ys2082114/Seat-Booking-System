import axios from 'axios'

// With Vite's proxy, we just need relative paths
const api = axios.create({
    baseURL: '/',
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Auto-logout on 401 (expired / invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/auth'
        }
        return Promise.reject(error)
    }
)

export default api
