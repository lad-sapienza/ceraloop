import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import Footer from '../components/Footer'
import { COLLECTIONS } from '../config/collections'

// Simple Pie Chart Component
function PieChart({ evaluated, remaining, total }) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    )
  }

  const evaluatedPercentage = (evaluated / total) * 100
  const remainingPercentage = (remaining / total) * 100

  // Calculate pie chart segments (using SVG circle with stroke-dasharray)
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const evaluatedLength = (evaluatedPercentage / 100) * circumference
  const remainingLength = (remainingPercentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Pie Chart SVG */}
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="40"
            className="dark:stroke-gray-700"
          />
          
          {/* Evaluated segment (green) */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="40"
            strokeDasharray={`${evaluatedLength} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          
          {/* Remaining segment (orange) */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="40"
            strokeDasharray={`${remainingLength} ${circumference}`}
            strokeDashoffset={-evaluatedLength}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {evaluatedPercentage.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Complete
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <div className="text-sm">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{evaluated}</span>
            <span className="text-gray-600 dark:text-gray-400"> Evaluated</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
          <div className="text-sm">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{remaining}</span>
            <span className="text-gray-600 dark:text-gray-400"> Remaining</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Report() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    evaluated: 0,
    remaining: 0
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)

        // Get current user's ID and name
        const userRes = await api.get('/users/me', {
          params: {
            fields: ['id', 'first_name', 'last_name', 'email', 'avatar']
          }
        })
        const userData = userRes.data.data || userRes.data
        const userId = userData?.id
        
        // Try multiple fallbacks for the display name
        let displayName = ''
        if (userData?.first_name && userData.first_name.trim() !== '') {
          displayName = userData.first_name.trim()
        } else if (userData?.last_name && userData.last_name.trim() !== '') {
          displayName = userData.last_name.trim()
        } else if (userData?.email && typeof userData.email === 'string') {
          displayName = userData.email.split('@')[0]
        } else {
          displayName = 'User'
        }

        if (!userId) {
          throw new Error('Could not retrieve user ID')
        }

        setUserName(displayName)

        // Load user avatar if available
        if (userData?.avatar) {
          try {
            // Get the file UUID from the avatar field
            const avatarId = typeof userData.avatar === 'string' ? userData.avatar : userData.avatar.id
            const fileRes = await api.get('/files', {
              params: {
                'filter[id][_eq]': avatarId
              }
            })
            const fileData = fileRes.data?.data?.[0] || fileRes.data?.[0]
            
            if (fileData?.id && fileData?.filename_download) {
              const imageRes = await api.get(`/assets/${fileData.id}/${fileData.filename_download}`, {
                responseType: 'blob'
              })
              const imageUrl = URL.createObjectURL(imageRes.data)
              setUserAvatar(imageUrl)
            }
          } catch (avatarErr) {
            console.error('Failed to load avatar:', avatarErr)
            // Silently fail - avatar is optional
          }
        }

        // Get total count of model_output items
        const totalRes = await api.get(`/items/${COLLECTIONS.MODEL_OUTPUT}`, {
          params: {
            'fields': 'id',
            'limit': -1 // Get all items to count
          }
        })
        const totalItems = totalRes.data?.data || totalRes.data || []
        const total = totalItems.length

        // Get count of items the user has evaluated
        const evaluatedRes = await api.get(`/items/${COLLECTIONS.USER_FEEDBACKS}`, {
          params: {
            'filter[user_created][_eq]': userId,
            'fields': 'id,item',
            'limit': -1
          }
        })
        const evaluatedItems = evaluatedRes.data?.data || evaluatedRes.data || []
        const evaluated = evaluatedItems.length

        const remaining = total - evaluated

        setStats({
          total,
          evaluated,
          remaining
        })

      } catch (err) {
        console.error('Error fetching stats:', err)
        setError(err.response?.data?.message || err.message || 'Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-8 pb-8">
        <main>
          <div className="card w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              {userAvatar && (
                <img 
                  src={userAvatar} 
                  alt={userName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
                />
              )}
              <h3 className="text-2xl font-semibold dark:text-gray-100">
                {userName ? `${userName}'s Evaluation Progress` : 'Evaluation Progress'}
              </h3>
            </div>
            
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading statistics...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-8">
                {/* Pie Chart */}
                <div className="flex justify-center py-8">
                  <PieChart 
                    evaluated={stats.evaluated}
                    remaining={stats.remaining}
                    total={stats.total}
                  />
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
                    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                      Total Items
                    </div>
                    <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                      {stats.total}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                      Evaluated
                    </div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {stats.evaluated}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {stats.total > 0 ? `${((stats.evaluated / stats.total) * 100).toFixed(1)}%` : '0%'}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                    <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                      Remaining
                    </div>
                    <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                      {stats.remaining}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {stats.total > 0 ? `${((stats.remaining / stats.total) * 100).toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>

                {/* Progress Message */}
                {stats.remaining === 0 && stats.total > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-semibold text-green-800 dark:text-green-200">
                          Congratulations!
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          You have completed all evaluations. Thank you for your feedback!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stats.remaining > 0 && stats.evaluated > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-semibold text-blue-800 dark:text-blue-200">
                          Keep going!
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          You have {stats.remaining} item{stats.remaining !== 1 ? 's' : ''} left to evaluate.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stats.evaluated === 0 && stats.total > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div>
                        <div className="font-semibold text-indigo-800 dark:text-indigo-200">
                          Ready to start!
                        </div>
                        <div className="text-sm text-indigo-700 dark:text-indigo-300">
                          You have {stats.total} item{stats.total !== 1 ? 's' : ''} waiting for your evaluation. Go to Home to begin!
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
