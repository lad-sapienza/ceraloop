import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as directusLogin } from '../services/auth'

export default function LoginForm({ onToggleMode, onOpenHelp }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Security state
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [loginDelay, setLoginDelay] = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Wait progressively longer after each failed attempt
      if (loginDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, loginDelay))
      }

      // Check if account is locked
      if (lockedUntil && Date.now() < lockedUntil) {
        setError('Invalid email or password.')
        return
      }

      await directusLogin(email, password)
      
      // Reset security counters on successful login
      setFailedAttempts(0)
      setLoginDelay(0)
      setLockedUntil(null)
      
      // tokens are stored by auth.setTokens inside login
      navigate('/', { replace: true })
    } catch (err) {
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)

      if (newFailedAttempts >= 5) {
        const lockoutTime = Date.now() + 5 * 60 * 1000
        setLockedUntil(lockoutTime)
      }

      // Generic error message - don't reveal information about account existence or lockout status
      setError('Invalid email or password.')

      // Exponential backoff: 1s, 2s, 4s, 8s, etc. up to 16s
      setLoginDelay(Math.min(loginDelay * 2 || 1000, 16000))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-center dark:text-gray-100">Login to CeraLoop</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            className="input mt-1 w-full"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            className="input mt-1 w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

        <div className="flex items-center justify-between">
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <button
            type="button"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            onClick={onOpenHelp}
          >
            More information
          </button>
        </div>
      </form>

      {/* Toggle to register */}
      <div className="flex justify-end mb-2">
        <button
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          onClick={onToggleMode}
        >
          Create a new account
        </button>
      </div>
    </>
  )
}
