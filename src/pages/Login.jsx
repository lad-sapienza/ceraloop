import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as directusLogin } from '../services/auth'
import { useTheme } from '../context/ThemeContext'
import Footer from '../components/Footer'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import helpContent from './help.md?raw'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('login') // 'login' | 'register'

  // Register form state
  const [rFirstName, setRFirstName] = useState('')
  const [rLastName, setRLastName] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rEmail2, setREmail2] = useState('')
  const [rPassword, setRPassword] = useState('')
  const [rAvatar, setRAvatar] = useState(null)
  const [rLoading, setRLoading] = useState(false)
  const [rError, setRError] = useState(null)
  const [rSuccess, setRSuccess] = useState(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await directusLogin(email, password)
      // tokens are stored by auth.setTokens inside login
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-3 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg hover:shadow-xl transition"
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>
        <div className="card max-w-md w-full">
          <div className="flex justify-center mb-6">
            <img src="/CeraLoop.png" alt="CeraLoop" className="h-24" />
          </div>

          {mode === 'login' ? (
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
                    onClick={() => setHelpOpen(true)}
                  >
                    More information
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center dark:text-gray-100">Create your account</h1>
              <p className="text-xs text-gray-600 dark:text-gray-300 text-center mb-4">
                Please provide a valid email address <span className="font-semibold">twice</span>. All future communications will be sent there.
              </p>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setRError(null)
                  setRSuccess(null)
                  if (!rEmail || !rEmail2 || rEmail.trim().toLowerCase() !== rEmail2.trim().toLowerCase()) {
                    setRError('Emails do not match. Please enter the same valid email twice.')
                    return
                  }
                  if (!rPassword) {
                    setRError('Password is required')
                    return
                  }
                  try {
                    setRLoading(true)
                    const base = (import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '')

                    // Optional avatar upload
                    let avatarId = null
                    if (rAvatar) {
                      const fd = new FormData()
                      fd.append('file', rAvatar)
                      const upRes = await axios.post(`${base}/files`, fd, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      })
                      const upData = upRes.data?.data || upRes.data
                      avatarId = upData?.id || null
                    }

                    // Create user
                    const defaultRole = import.meta.env.VITE_DIRECTUS_DEFAULT_ROLE
                    const body = {
                      email: rEmail.trim().toLowerCase(),
                      password: rPassword,
                      first_name: rFirstName || null,
                      last_name: rLastName || null,
                      // Assign default role (site-specific). Prefer setting via Directus Presets; include only if provided via env.
                      ...(defaultRole ? { role: defaultRole } : {}),
                      ...(avatarId ? { avatar: avatarId } : {}),
                    }
                    await axios.post(`${base}/users`, body)

                    setRSuccess('Account created. An admin will activate it by assigning a dataset to evaluate. You will be notified via your email address.')
                    // Reset some fields but keep emails visible
                    setRPassword('')
                    setRAvatar(null)
                  } catch (err) {
                    const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message
                    setRError(msg)
                  } finally {
                    setRLoading(false)
                  }
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                    <input className="input mt-1 w-full" value={rFirstName} onChange={(e)=>setRFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                    <input className="input mt-1 w-full" value={rLastName} onChange={(e)=>setRLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input className="input mt-1 w-full" type="email" required value={rEmail} onChange={(e)=>setREmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm email</label>
                  <input className="input mt-1 w-full" type="email" required value={rEmail2} onChange={(e)=>setREmail2(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input className="input mt-1 w-full" type="password" required value={rPassword} onChange={(e)=>setRPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar (optional)</label>
                  <input className="mt-1 w-full text-sm text-gray-700 dark:text-gray-300" type="file" accept="image/*" onChange={(e)=>setRAvatar(e.target.files?.[0] || null)} />
                </div>

                {rError && <div className="text-sm text-red-600 dark:text-red-400">{rError}</div>}
                {rSuccess && (
                  <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                    {rSuccess}
                  </div>
                )}

                <div className="flex items-center justify-start mt-2">
                  <button className={`btn-primary ${rLoading ? 'opacity-75 cursor-not-allowed' : ''}`} disabled={rLoading}>
                    {rLoading ? 'Creating…' : 'Create account'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Toggle */}
          <div className="flex justify-end mb-2">
            {mode === 'login' ? (
              <button
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={() => { setMode('register'); setError(null) }}
              >
                Create a new account
              </button>
            ) : (
              <button
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={() => { setMode('login'); setRError(null); setRSuccess(null) }}
              >
                Back to sign in
              </button>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center my-6 border-t pt-4 border-blue-600 dark:border-blue-400">
            Powered by{' '}
            <a 
              href="https://lad.saras.uniroma1.it/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex flex-col items-center gap-2"
            >
              LAD: Laboratorio di Archeologia Digitale alla Sapienza
              <img src="/LAD-logo.png" alt="LAD Logo" className="h-10" />
            </a>
          </p>
        </div>
      </div>
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setHelpOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-base font-semibold dark:text-gray-100">Help</h4>
              <button
                onClick={() => setHelpOpen(false)}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                aria-label="Close help"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="prose prose-indigo max-w-none dark:prose-invert text-gray-900 dark:text-gray-100">
                <ReactMarkdown>{helpContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer fixed />
    </div>
  )
}
