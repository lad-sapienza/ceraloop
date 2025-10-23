import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'

const EDU_OPTIONS = [
  'None',
  'Bachelor’s Degree',
  'Master’s Degree',
  'Postgraduate Specialization School',
  'PhD',
  'Research Fellowship',
]

const EXP_OPTIONS = [
  { label: 'none', value: '0' },
  { label: 'up to 5 years', value: '5' },
  { label: 'up to 10 years', value: '10' },
  { label: 'more than 10 years', value: '10+' },
]

export default function AboutMe() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [recordId, setRecordId] = useState(null)
  const [saving, setSaving] = useState(false)

  const [educationalQualification, setEducationalQualification] = useState(['None'])
  const [experienceArchaeology, setExperienceArchaeology] = useState('0')
  const [experiencePottery, setExperiencePottery] = useState('0')
  const [moreAboutMe, setMoreAboutMe] = useState('')

  const expOptions = useMemo(() => EXP_OPTIONS, [])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        setSuccess(null)

        // Get current user id
        const meRes = await api.get('/users/me', { params: { fields: 'id' } })
        const userId = (meRes.data?.data || meRes.data)?.id
        if (!userId) throw new Error('Unable to determine current user')

        // Fetch existing user_information limited to current user
        const res = await api.get('/items/user_information', {
          params: {
            'filter[user_created][_eq]': userId,
            fields: 'id,educational_qualification,experience_in_archaeology,experience_with_documentation_and_study_of_pottery,more_about_me',
            limit: 1,
          },
        })
        const data = (res.data?.data || res.data || [])[0]

        if (data) {
          setRecordId(data.id)
          const edu = Array.isArray(data.educational_qualification) ? data.educational_qualification : []
          setEducationalQualification(edu.length > 0 ? edu : ['None'])
          setExperienceArchaeology(
            data.experience_in_archaeology !== undefined && data.experience_in_archaeology !== null && data.experience_in_archaeology !== ''
              ? String(data.experience_in_archaeology)
              : '0'
          )
          setExperiencePottery(
            data.experience_with_documentation_and_study_of_pottery !== undefined && data.experience_with_documentation_and_study_of_pottery !== null && data.experience_with_documentation_and_study_of_pottery !== ''
              ? String(data.experience_with_documentation_and_study_of_pottery)
              : '0'
          )
          setMoreAboutMe(typeof data.more_about_me === 'string' ? data.more_about_me : '')
        } else {
          // No record available; start with empty form
          setRecordId(null)
          setEducationalQualification(['None'])
          setExperienceArchaeology('0')
          setExperiencePottery('0')
          setMoreAboutMe('')
        }
      } catch (e) {
        // If forbidden or not found, show empty form but note the message
        setRecordId(null)
        setEducationalQualification(['None'])
        setExperienceArchaeology('0')
        setExperiencePottery('0')
        setMoreAboutMe('')
        // Don't block the page, but surface message
        setError(e.response?.data?.message || e.message || 'Failed to load your information')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleEdu = (value) => {
    setEducationalQualification((prev) => {
      if (value === 'None') {
        return ['None']
      }
      const cleaned = prev.filter((v) => v !== 'None')
      const has = cleaned.includes(value)
      const next = has ? cleaned.filter((v) => v !== value) : [...cleaned, value]
      return next.length > 0 ? next : ['None']
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    // Enforce required defaults
    const eduFinal = (educationalQualification && educationalQualification.length > 0) ? educationalQualification : ['None']
    const expArchFinal = experienceArchaeology && experienceArchaeology !== '' ? experienceArchaeology : '0'
    const expPotFinal = experiencePottery && experiencePottery !== '' ? experiencePottery : '0'

    const payload = {
      educational_qualification: eduFinal,
      experience_in_archaeology: expArchFinal,
      experience_with_documentation_and_study_of_pottery: expPotFinal,
      more_about_me: moreAboutMe || null,
    }

    try {
      if (recordId) {
        const res = await api.patch(`/items/user_information/${recordId}`, payload)
        setSuccess('Information updated successfully')
      } else {
        const res = await api.post('/items/user_information', payload)
        const created = res.data?.data || res.data
        setRecordId(created?.id || null)
        setSuccess('Information saved successfully')
      }
    } catch (e) {
      setError(e.response?.data?.errors?.[0]?.message || e.response?.data?.message || e.message || 'Save failed')
    } finally {
      setSaving(false)
      // Auto-clear success after a short delay
      setTimeout(() => setSuccess(null), 2500)
    }
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

            {loading && (
              <div className="text-gray-600 dark:text-gray-300">Loading your information…</div>
            )}

            {!loading && (
              <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-400">
                    {success}
                  </div>
                )}

                {/* Educational Qualification (checkboxes) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Educational qualification
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EDU_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-gray-800 dark:text-gray-200 bg-white/60 dark:bg-slate-700/60 rounded-md px-3 py-2 border border-gray-200 dark:border-slate-600">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500"
                          checked={educationalQualification.includes(opt)}
                          onChange={() => toggleEdu(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience in archaeology */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Experience in archaeology
                  </label>
                  <select
                    className="input w-full"
                    value={experienceArchaeology}
                    onChange={(e) => setExperienceArchaeology(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {expOptions.map((o) => (
                      <option key={o.value} value={o.value}>{`${o.label}`}</option>
                    ))}
                  </select>
                </div>

                {/* Experience with documentation and study of pottery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Experience with documentation and study of pottery
                  </label>
                  <select
                    className="input w-full"
                    value={experiencePottery}
                    onChange={(e) => setExperiencePottery(e.target.value)}
                  >
                    {expOptions.map((o) => (
                      <option key={o.value} value={o.value}>{`${o.label}`}</option>
                    ))}
                  </select>
                </div>

                {/* More about me (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    More about me (optional)
                  </label>
                  <textarea
                    className="input w-full min-h-[120px]"
                    rows={4}
                    value={moreAboutMe}
                    onChange={(e) => setMoreAboutMe(e.target.value)}
                    placeholder="Add any detail you think may help contextualize your evaluations (methods, periods, regions, training, etc.)."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className={`btn-primary ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
                    disabled={saving}
                  >
                    {recordId ? (saving ? 'Updating…' : 'Update') : (saving ? 'Saving…' : 'Save new')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
