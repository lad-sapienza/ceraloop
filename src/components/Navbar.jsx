import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { clearTokens } from '../services/auth'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [profileStatus, setProfileStatus] = useState('none') // none | incomplete | complete
  const menuRef = useRef(null)

  const logout = () => {
    clearTokens()
    navigate('/login', { replace: true })
  }

  const isActive = (path) => location.pathname === path

  useEffect(() => {
    // Close menu on outside click
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  useEffect(() => {
    // Close menu on route change
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    // Load current user basic info + avatar and profile status
    async function loadUser() {
      try {
        const userRes = await api.get('/users/me', {
          params: { fields: ['id', 'first_name', 'last_name', 'email', 'avatar'] }
        })
        const user = userRes.data?.data || userRes.data || {}

        // Derive display name
        let displayName = ''
        if (user?.first_name && user.first_name.trim() !== '') displayName = user.first_name.trim()
        else if (user?.last_name && user.last_name.trim() !== '') displayName = user.last_name.trim()
        else if (typeof user?.email === 'string') displayName = user.email.split('@')[0]
        else displayName = 'User'
        setUserName(displayName)

        // Load avatar if present
        const avatarId = typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.id
        if (avatarId) {
          try {
            const fileRes = await api.get('/files', { params: { 'filter[id][_eq]': avatarId } })
            const file = fileRes.data?.data?.[0] || fileRes.data?.[0]
            if (file?.id) {
              const imgRes = await api.get(`/assets/${file.id}/${file.filename_download}`, { responseType: 'blob' })
              const url = URL.createObjectURL(imgRes.data)
              setAvatarUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return url
              })
            }
          } catch (e) {
            // Avatar optional: ignore failures
          }
        }

        // Evaluate user_information profile status
        if (user?.id) {
          try {
            const infoRes = await api.get('/items/user_information', {
              params: {
                'filter[user_created][_eq]': user.id,
                fields: 'educational_qualification,experience_in_archaeology,experience_with_documentation_and_study_of_pottery,more_about_me',
                limit: 1
              }
            })
            const rec = (infoRes.data?.data || infoRes.data || [])[0]
            if (!rec) {
              setProfileStatus('none')
            } else {
              const edu = Array.isArray(rec.educational_qualification) ? rec.educational_qualification : []
              const expA = String(rec.experience_in_archaeology ?? '')
              const expP = String(rec.experience_with_documentation_and_study_of_pottery ?? '')
              const more = rec.more_about_me || ''
              const isDefaultEdu = edu.length === 0 || (edu.length === 1 && edu[0] === 'None')
              const isDefaultExpA = expA === '' || expA === '0'
              const isDefaultExpP = expP === '' || expP === '0'
              const isMoreEmpty = !more || more.trim() === ''
              if (!isDefaultEdu || !isDefaultExpA || !isDefaultExpP || !isMoreEmpty) {
                setProfileStatus('complete')
              } else {
                setProfileStatus('incomplete')
              }
            }
          } catch (e) {
            setProfileStatus('none')
          }
        }
      } catch (e) {
        // If user fetch fails, keep defaults
      }
    }
    loadUser()

    // Cleanup object URL on unmount
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/90 backdrop-blur-md shadow-md">
      <div className="mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Menu Items */}
          <div className="flex items-center gap-6">
            <Link to="/">
              <img src="/CeraLoop.png" alt="CeraLoop" className="h-10" />
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className={`font-medium transition ${
                  isActive('/') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/report"
                className={`font-medium transition ${
                  isActive('/report') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                Report
              </Link>
              <Link 
                to="/help"
                className={`font-medium transition ${
                  isActive('/help') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                Help
              </Link>
              <Link 
                to="/about"
                className={`font-medium transition ${
                  isActive('/about') 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                About me
              </Link>
            </div>
          </div>

          {/* Right: Theme Toggle and User Menu */}
          <div className="flex items-center gap-3" ref={menuRef}>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/80 dark:bg-slate-700/80 hover:bg-gray-100 dark:hover:bg-slate-600 transition"
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
            {/* Avatar button */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 focus:outline-none"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {(() => {
                  const ringColor = profileStatus === 'complete' ? 'ring-green-500' : profileStatus === 'incomplete' ? 'ring-yellow-500' : 'ring-red-500'
                  return (
                    <div
                      className={`w-9 h-9 rounded-full ring-2 ${ringColor} overflow-hidden bg-indigo-100 dark:bg-slate-600 flex items-center justify-center`}
                      title={
                        profileStatus === 'complete'
                          ? 'Profile information: complete'
                          : profileStatus === 'incomplete'
                          ? 'Profile information: incomplete'
                          : 'Profile information: missing'
                      }
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={userName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-indigo-700 dark:text-slate-200">
                          {userName ? userName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      )}
                    </div>
                  )
                })()}
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 rounded-lg shadow-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 py-1 z-50"
                >
                  {userName && (
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-300 border-b border-gray-100 dark:border-slate-600">
                      Signed in as <span className="font-medium">{userName}</span>
                    </div>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/about') }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center gap-2"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
                    </svg>
                    About me
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center gap-2"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
