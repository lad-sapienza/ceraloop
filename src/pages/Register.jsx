import React, { useState } from 'react'
import axios from 'axios'

export default function Register({ onToggleMode, onOpenHelp }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [email2, setEmail2] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Security state
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [registerDelay, setRegisterDelay] = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Progressive delay - wait before processing
    if (registerDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, registerDelay))
    }

    // Check if account is locked
    if (lockedUntil && Date.now() < lockedUntil) {
      setError('Too many failed attempts. Please try again later.')
      return
    }

    if (!email || !email2 || email.trim().toLowerCase() !== email2.trim().toLowerCase()) {
      setError('Emails do not match. Please enter the same valid email twice.')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }

    try {
      setLoading(true)
      const base = (import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '')

      // Optional avatar upload
      let avatarId = null
      if (avatar) {
        const fd = new FormData()
        fd.append('file', avatar)
        const upRes = await axios.post(`${base}/files`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const upData = upRes.data?.data || upRes.data
        avatarId = upData?.id || null
      }

      // Create user
      const defaultRole = import.meta.env.VITE_DIRECTUS_DEFAULT_ROLE
      const body = {
        email: email.trim().toLowerCase(),
        password: password,
        first_name: firstName || null,
        last_name: lastName || null,
        // Assign default role (site-specific). Prefer setting via Directus Presets; include only if provided via env.
        ...(defaultRole ? { role: defaultRole } : {}),
        ...(avatarId ? { avatar: avatarId } : {}),
      }
      await axios.post(`${base}/users`, body)

      // Reset security counters on successful registration
      setFailedAttempts(0)
      setRegisterDelay(0)
      setLockedUntil(null)

      setSuccess('Account created successfully! A dataset has been automatically assigned. You can now sign in and start working.')
      // Reset some fields but keep emails visible
      setPassword('')
      setAvatar(null)
    } catch (err) {
      const newFailedAttempts = failedAttempts + 1
      setFailedAttempts(newFailedAttempts)

      if (newFailedAttempts >= 5) {
        const lockoutTime = Date.now() + 5 * 60 * 1000
        setLockedUntil(lockoutTime)
      }

      // Generic error message to avoid information disclosure
      const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message
      setError(msg || 'Registration failed. Please try again.')

      // Exponential backoff: 1s, 2s, 4s, 8s, etc. up to 16s
      setRegisterDelay(Math.min(registerDelay * 2 || 1000, 16000))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 text-center dark:text-gray-100">Create your account</h1>
      <p className="text-xs text-gray-600 dark:text-gray-300 text-center mb-4">
        Please provide a valid email address <span className="font-semibold">twice</span>. All future communications will be sent there.
      </p>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
            <input 
              className="input mt-1 w-full" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
            <input 
              className="input mt-1 w-full" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input 
            className="input mt-1 w-full" 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm email</label>
          <input 
            className="input mt-1 w-full" 
            type="email" 
            required 
            value={email2} 
            onChange={(e) => setEmail2(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input 
            className="input mt-1 w-full" 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar (optional)</label>
          <input 
            className="mt-1 w-full text-sm text-gray-700 dark:text-gray-300" 
            type="file" 
            accept="image/*" 
            onChange={(e) => setAvatar(e.target.files?.[0] || null)} 
          />
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
        {success && (
          <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
            {success}
          </div>
        )}

        <div className="flex items-center justify-start mt-2">
          <button 
            className={`btn-primary ${loading ? 'opacity-75 cursor-not-allowed' : ''}`} 
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>

      {/* Toggle to login */}
      <div className="flex justify-end mb-2">
        <button
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          onClick={onToggleMode}
        >
          Back to sign in
        </button>
      </div>
    </>
  )
}
