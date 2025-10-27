import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DynamicForm from '../components/DynamicForm'
import { toast } from '../components/Toaster'
import api from '../services/api'
import { COLLECTIONS } from '../config/collections'

export default function AboutMe() {
  const [loading, setLoading] = useState(true)
  const [recordId, setRecordId] = useState(null)
  const [initialData, setInitialData] = useState({})

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        // Get current user id
        const meRes = await api.get('/users/me', { params: { fields: 'id' } })
        const userId = (meRes.data?.data || meRes.data)?.id
        if (!userId) throw new Error('Unable to determine current user')

        // Fetch existing user_information limited to current user
        const res = await api.get(`/items/${COLLECTIONS.USER_INFORMATION}`, {
          params: {
            'filter[user_created][_eq]': userId,
            limit: 1,
          },
        })
        const data = (res.data?.data || res.data || [])[0]

        if (data) {
          setRecordId(data.id)
          // Set initial data, ensuring defaults for fields if empty
          setInitialData({
            educational_qualification: Array.isArray(data.educational_qualification) && data.educational_qualification.length > 0
              ? data.educational_qualification
              : ['None'],
            experience_in_archaeology: data.experience_in_archaeology !== undefined && data.experience_in_archaeology !== null && data.experience_in_archaeology !== ''
              ? String(data.experience_in_archaeology)
              : '0',
            experience_with_documentation_and_study_of_pottery: data.experience_with_documentation_and_study_of_pottery !== undefined && data.experience_with_documentation_and_study_of_pottery !== null && data.experience_with_documentation_and_study_of_pottery !== ''
              ? String(data.experience_with_documentation_and_study_of_pottery)
              : '0',
            more_about_me: typeof data.more_about_me === 'string' ? data.more_about_me : '',
          })
        } else {
          // No record available; start with defaults
          setRecordId(null)
          setInitialData({
            educational_qualification: ['None'],
            experience_in_archaeology: '0',
            experience_with_documentation_and_study_of_pottery: '0',
            more_about_me: '',
          })
        }
      } catch (e) {
        // If forbidden or not found, show empty form with defaults
        console.error('AboutMe load error:', e.response || e)
        const serverMsg = e.response?.data?.errors?.[0]?.message || e.response?.data?.message || e.message
        // Inform the user (useful when permission issue occurs)
        toast.error(`About me: ${serverMsg}`)
        setRecordId(null)
        setInitialData({
          educational_qualification: ['None'],
          experience_in_archaeology: '0',
          experience_with_documentation_and_study_of_pottery: '0',
          more_about_me: '',
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSuccess = (savedRecordId, data) => {
    setRecordId(savedRecordId)
    // Optionally reload or show confirmation
  }

  const handleError = (error) => {
    // Error already shown via toast in DynamicForm
    console.error('Save error:', error)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-8 pb-8">
        <main>
          <div className="card w-full max-w-3xl mx-auto">
            <h3 className="text-2xl font-semibold mb-3 dark:text-gray-100">About me</h3>
            <div className="mb-6 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/20 p-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    Your background helps us interpret and weight your feedback on pottery profiles more accurately. We use it to contextualize individual judgments and improve the quality of aggregate analyses.
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 dark:text-gray-200 space-y-1">
                    <li>
                      <span className="font-medium">Educational qualification</span> helps calibrate how much confidence we assign to domain-specific assessments.
                    </li>
                    <li>
                      <span className="font-medium">Experience in archaeology</span> informs how we interpret uncertainty, outliers, and consensus.
                    </li>
                    <li>
                      <span className="font-medium">Experience with documentation and study of pottery</span> guides how we weigh typological and profile-related judgments.
                    </li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    This information is used only within this project to make your feedback more meaningful. You can revisit and update it at any time.
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-gray-600 dark:text-gray-300">Loading your information…</div>
            ) : (
              <DynamicForm
                api={api}
                collection={COLLECTIONS.USER_INFORMATION}
                recordId={recordId}
                initialData={initialData}
                onSuccess={handleSuccess}
                onError={handleError}
                excludeFields={['id', 'user_created', 'user_updated', 'date_created', 'date_updated']}
                submitLabel={recordId ? 'Update' : 'Save'}
              />
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
