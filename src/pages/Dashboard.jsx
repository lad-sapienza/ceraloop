import React, { useEffect, useState } from 'react'
import api from '../services/api'
import Navbar from '../components/Navbar'
import AuthImage from '../components/AuthImage'
import ImagePanel from '../components/ImagePanel'
import Footer from '../components/Footer'
import { toast } from '../components/Toaster'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [modelOutput, setModelOutput] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modelLoading, setModelLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modelError, setModelError] = useState(null)
  const [matchImages, setMatchImages] = useState([])
  const [grayedImages, setGrayedImages] = useState(new Set())
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [draggedOverIndex, setDraggedOverIndex] = useState(null)
  const [savedSelection, setSavedSelection] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [recentRecords, setRecentRecords] = useState([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Time tracking - starts on first interaction
  const [evaluationStartTime, setEvaluationStartTime] = useState(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get('/users/me')
        setProfile(res.data.data || res.data)
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    async function fetchModelOutput() {
      try {
        // First, get the current user's ID
        const userRes = await api.get('/users/me?fields=id')
        const userId = (userRes.data.data || userRes.data)?.id
        
        if (!userId) {
          throw new Error('Could not retrieve user ID')
        }

        // Get all items that the current user has already provided feedback for
        const feedbackRes = await api.get('/items/user_feedbacks', {
          params: {
            'filter[user_created][_eq]': userId,
            'fields': 'item',
            'limit': -1 // Get all records
          }
        })
        
        const feedbackItems = (feedbackRes.data.data || feedbackRes.data || [])
          .map(feedback => feedback.item)
          .filter(Boolean) // Remove null/undefined values

        console.log('User has provided feedback for items:', feedbackItems)

        // Get the first model_output item that is NOT in the feedback list
        let modelOutputRes
        if (feedbackItems.length > 0) {
          // Exclude items that already have feedback from this user
          modelOutputRes = await api.get('/items/model_output', {
            params: {
              'filter[item][_nin]': feedbackItems.join(','), // NOT IN array
              'limit': 1,
              'sort': 'id' // Get the first one by ID
            }
          })
        } else {
          // User has no feedback yet, get the first item
          modelOutputRes = await api.get('/items/model_output', {
            params: {
              'limit': 1,
              'sort': 'id'
            }
          })
        }

        const record = (modelOutputRes.data.data || modelOutputRes.data)?.[0] || null
        
        if (!record) {
          setModelError('All items have been reviewed. Thank you for your feedback!')
        }
        
        setModelOutput(record)
        console.log('Loaded model output item:', record?.item)
        
      } catch (err) {
        console.error('Error fetching model output:', err)
        setModelError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message)
      } finally {
        setModelLoading(false)
      }
    }
    fetchModelOutput()
  }, [])

  // Extract and set match images when modelOutput changes
  useEffect(() => {
    if (!modelOutput) return
    const matches = []
    Object.keys(modelOutput).forEach(key => {
      if (key.startsWith('match_') && modelOutput[key]) {
        const value = modelOutput[key]
        matches.push({
          key,
          basename: value,
          filename: `${value}.png`
        })
      }
    })
    setMatchImages(matches)
  }, [modelOutput])

  // Generate report when match images are loaded or updated
  useEffect(() => {
    if (matchImages.length > 0) {
      generateReport()
    }
  }, [matchImages, grayedImages])

  // Function to start timer on first interaction
  const startTimerOnFirstInteraction = () => {
    if (!hasInteracted && !evaluationStartTime) {
      setEvaluationStartTime(Date.now())
      setHasInteracted(true)
    }
  }

  // Reset timer when loading a new item
  useEffect(() => {
    if (modelOutput) {
      setEvaluationStartTime(null)
      setHasInteracted(false)
    }
  }, [modelOutput])

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    startTimerOnFirstInteraction()
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Only update if the index actually changed
    if (draggedOverIndex !== index) {
      setDraggedOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedOverIndex(null)
    setDraggedIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverIndex(null)
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newImages = [...matchImages]
    const draggedItem = newImages[draggedIndex]
    newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedItem)
    
    // Update grayed images indices after reordering
    const newGrayedImages = new Set()
    grayedImages.forEach(oldIndex => {
      if (oldIndex === draggedIndex) {
        newGrayedImages.add(dropIndex)
      } else if (oldIndex < draggedIndex && oldIndex >= dropIndex) {
        newGrayedImages.add(oldIndex + 1)
      } else if (oldIndex > draggedIndex && oldIndex <= dropIndex) {
        newGrayedImages.add(oldIndex - 1)
      } else {
        newGrayedImages.add(oldIndex)
      }
    })
    
    setMatchImages(newImages)
    setGrayedImages(newGrayedImages)
    setDraggedIndex(null)
  }

  const generateReport = (images = matchImages, grayedSet = grayedImages) => {
    if (images.length === 0) return
    
    const enabled = images
      .map((match, idx) => ({ match, idx, isGrayed: grayedSet.has(idx) }))
      .filter(item => !item.isGrayed)
      .map((item, order) => ({
        order: order + 1,
        basename: item.match.basename,
        weight: 1 - (order * 0.1)
      }))
    
    const disabled = images
      .map((match, idx) => ({ match, idx, isGrayed: grayedSet.has(idx) }))
      .filter(item => item.isGrayed)
      .map((item, order) => ({
        order: enabled.length + order + 1,
        basename: item.match.basename,
        weight: 0
      }))
    
    setSavedSelection([...enabled, ...disabled])
  }

  const toggleGray = (index) => {
    startTimerOnFirstInteraction()
    setGrayedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      
      // Move disabled items to the end
      setTimeout(() => {
        setMatchImages(currentImages => {
          const enabled = currentImages.filter((_, idx) => !newSet.has(idx))
          const disabled = currentImages.filter((_, idx) => newSet.has(idx))
          
          // Update grayed indices after reordering
          const updatedGrayedImages = new Set()
          disabled.forEach((_, idx) => {
            updatedGrayedImages.add(enabled.length + idx)
          })
          setGrayedImages(updatedGrayedImages)
          
          return [...enabled, ...disabled]
        })
      }, 50)
      
      return newSet
    })
  }

  const handleMoveUp = (index) => {
    startTimerOnFirstInteraction()
    if (index === 0) return // Already at top
    
    const newImages = [...matchImages]
    const temp = newImages[index]
    newImages[index] = newImages[index - 1]
    newImages[index - 1] = temp
    
    // Update grayed images indices
    const newGrayedImages = new Set()
    grayedImages.forEach(oldIndex => {
      if (oldIndex === index) {
        newGrayedImages.add(index - 1)
      } else if (oldIndex === index - 1) {
        newGrayedImages.add(index)
      } else {
        newGrayedImages.add(oldIndex)
      }
    })
    
    setMatchImages(newImages)
    setGrayedImages(newGrayedImages)
  }

  const handleMoveDown = (index) => {
    startTimerOnFirstInteraction()
    if (index === matchImages.length - 1) return // Already at bottom
    
    const newImages = [...matchImages]
    const temp = newImages[index]
    newImages[index] = newImages[index + 1]
    newImages[index + 1] = temp
    
    // Update grayed images indices
    const newGrayedImages = new Set()
    grayedImages.forEach(oldIndex => {
      if (oldIndex === index) {
        newGrayedImages.add(index + 1)
      } else if (oldIndex === index + 1) {
        newGrayedImages.add(index)
      } else {
        newGrayedImages.add(oldIndex)
      }
    })
    
    setMatchImages(newImages)
    setGrayedImages(newGrayedImages)
  }

  const loadNextModelOutput = async (opts = {}) => {
    const { excludeItem = null, retries = 2, delayMs = 350 } = opts
    try {
      setModelLoading(true)
      setModelError(null)
      
      // Get the current user's ID
      const userRes = await api.get('/users/me?fields=id')
      const userId = (userRes.data.data || userRes.data)?.id
      
      if (!userId) {
        throw new Error('Could not retrieve user ID')
      }

      // Get all items that the current user has already provided feedback for
      const feedbackRes = await api.get('/items/user_feedbacks', {
        params: {
          'filter[user_created][_eq]': userId,
          'fields': 'item',
          'limit': -1
        }
      })
      
      const feedbackItems = (feedbackRes.data.data || feedbackRes.data || [])
        .map(feedback => feedback.item)
        .filter(Boolean)

      // Also exclude the current item just saved (in case of eventual consistency)
      const excludeList = [...feedbackItems]
      if (excludeItem && !excludeList.includes(excludeItem)) excludeList.push(excludeItem)

      // Get the first model_output item that is NOT in the feedback list
      let modelOutputRes
      if (excludeList.length > 0) {
        modelOutputRes = await api.get('/items/model_output', {
          params: {
            'filter[item][_nin]': excludeList.join(','),
            'limit': 1,
            'sort': 'id'
          }
        })
      } else {
        modelOutputRes = await api.get('/items/model_output', {
          params: {
            'limit': 1,
            'sort': 'id'
          }
        })
      }

      let record = (modelOutputRes.data.data || modelOutputRes.data)?.[0] || null

      // Retry a couple of times if not found or if the excluded item sneaks back
      let attempts = retries
      while (attempts > 0 && (!record || (excludeItem && record?.item === excludeItem))) {
        await new Promise(res => setTimeout(res, delayMs))
        const retryRes = await api.get('/items/model_output', {
          params: excludeList.length > 0
            ? { 'filter[item][_nin]': excludeList.join(','), 'limit': 1, 'sort': 'id' }
            : { 'limit': 1, 'sort': 'id' }
        })
        record = (retryRes.data.data || retryRes.data)?.[0] || null
        attempts--
      }

      if (!record) {
        setModelError('All items have been reviewed. Thank you for your feedback!')
        setModelOutput(null)
      } else {
        setModelOutput(record)
        console.log('Loaded next model output item:', record?.item)
      }
      
    } catch (err) {
      console.error('Error loading next model output:', err)
      setModelError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || err.message)
    } finally {
      setModelLoading(false)
    }
  }

  const handleSaveSelection = async () => {
    if (!modelOutput || !modelOutput.item) {
      setSaveError('No model output item to save')
      return
    }

    if (!savedSelection || savedSelection.length === 0) {
      setSaveError('No selection to save')
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      // Build the payload
      const payload = {
        item: String(modelOutput.item) // Ensure it's a string
      }

      // Calculate evaluation time in seconds (only if user interacted)
      let evaluationTimeSeconds = null
      if (evaluationStartTime && hasInteracted) {
        evaluationTimeSeconds = Math.round((Date.now() - evaluationStartTime) / 1000)
      }

      // Add evaluation time if available
      if (evaluationTimeSeconds !== null) {
        payload.evaluation_time = evaluationTimeSeconds
      }

      // Add match_N and score_N for each item (up to 10)
      for (let i = 0; i < 10; i++) {
        const item = savedSelection[i]
        payload[`match_${i + 1}`] = item?.basename ? String(item.basename) : null
        payload[`score_${i + 1}`] = item?.weight !== undefined ? Number(item.weight) : null
      }

      // Make the API call
      const response = await api.post('/items/user_feedbacks', payload)

  console.log('Feedback saved successfully:', response.data)

  // Success handling
  setSaveSuccess(true)
  toast.success('Feedback saved successfully!')
  // Refresh recent records list
  fetchRecentRecords()

      // Reset local UI state quickly and fetch the next item without a full reload.
      const justReviewedItem = String(modelOutput.item)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 1200)
      // Clear selection and UI affordances
      setSavedSelection(null)
      setGrayedImages(new Set())
      setMatchImages([])
      // Load the next record, also explicitly excluding the one we just saved
      loadNextModelOutput({ excludeItem: justReviewedItem })

    } catch (err) {
      console.error('Failed to save feedback:', err)
      
      // Error handling
      const errorMsg = err.response?.data?.errors?.[0]?.message 
                    || err.response?.data?.message
                    || err.message 
                    || 'Failed to save feedback'
  setSaveError(errorMsg)
  toast.error(errorMsg)
      
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch last 5 records created by current user
  const fetchRecentRecords = async () => {
    try {
      // Ensure we have the current user id
      const userRes = await api.get('/users/me', { params: { fields: 'id' } })
      const userId = (userRes.data?.data || userRes.data)?.id
      if (!userId) return

      const res = await api.get('/items/user_feedbacks', {
        params: {
          'filter[user_created][_eq]': userId,
          'fields': 'id,date_created',
          'sort': '-date_created',
          'limit': 5
        }
      })
      const data = res.data?.data || res.data || []
      setRecentRecords(data)
    } catch (e) {
      // Silently ignore for now
    }
  }

  // Load recent records on mount
  useEffect(() => {
    fetchRecentRecords()
  }, [])

  const promptDeleteRecord = (record) => {
    setRecordToDelete(record)
    setDeleteModalOpen(true)
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setRecordToDelete(null)
  }

  const confirmDelete = async () => {
    if (!recordToDelete) return
    try {
      setIsDeleting(true)
      await api.delete(`/items/user_feedbacks/${recordToDelete.id}`)
      setRecentRecords(prev => prev.filter(r => r.id !== recordToDelete.id))
      setDeleteModalOpen(false)
      setRecordToDelete(null)
    } catch (e) {
      // Optional: surface an error state
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 px-8 pb-8">
        <main>
        
          {loading && <div className="card max-w-2xl mb-6"><div className="dark:text-gray-300">Loading profile...</div></div>}
          {error && <div className="card max-w-2xl mb-6"><div className="text-red-600 dark:text-red-400">{error}</div></div>}
          

        <div className="card w-full">
          <h3 className="text-xl font-semibold mb-4 dark:text-gray-100">Model Output</h3>
          {modelLoading && <div className="dark:text-gray-300">Loading model output...</div>}
          {modelError && <div className="text-red-600 dark:text-red-400">{modelError}</div>}
          {!modelLoading && !modelError && !modelOutput && (
            <div className="text-gray-500 dark:text-gray-400">No model output records found</div>
          )}
          {modelOutput && (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
              {/* Left side - Input Image */}
              <div>
                {modelOutput.image ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Reference Image [id#{modelOutput.id}]</h4>
                      <img 
                        src={`${import.meta.env.VITE_DIRECTUS_URL}/assets/${modelOutput.image}`}
                        alt="Model output"
                        className="w-64 h-auto rounded-lg shadow-lg"
                      />
                    </div>
                    {/* Save Selection Button */}
                    <button
                      onClick={handleSaveSelection}
                      disabled={isSaving}
                      className={`w-full px-4 py-3 font-medium rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 ${
                        isSaving
                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                          : saveSuccess
                          ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                          : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      } text-white`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : saveSuccess ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Saved!
                        </>
                      ) : (
                        'Save to database'
                      )}
                    </button>

                    {/* Save Error Message */}
                    {saveError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm text-red-700 dark:text-red-400">{saveError}</div>
                        </div>
                      </div>
                    )}

                    {/* Success toast replaces inline success message */}

                    {/* Recent Records List */}
                    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-semibold dark:text-gray-200">Your recent submissions</h5>
                        <button
                          onClick={fetchRecentRecords}
                          className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Refresh
                        </button>
                      </div>
                      {recentRecords.length === 0 ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">No recent submissions</div>
                      ) : (
                        <div className="space-y-2">
                          {recentRecords.map((rec) => (
                            <div key={rec.id} className="flex items-center justify-between text-sm bg-white dark:bg-slate-800 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-gray-800 dark:text-gray-200">#{rec.id}</span>
                                <span className="text-gray-500 dark:text-gray-400">{new Date(rec.date_created).toLocaleString()}</span>
                              </div>
                              <button
                                onClick={() => promptDeleteRecord(rec)}
                                className="p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                title="Delete record"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0h10" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>


                    
                    {/* Display Saved Selection */}
{/*                     
                    {savedSelection && (
                      <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-semibold mb-3 dark:text-gray-200">Current Selection:</h5>
                        <div className="space-y-2 text-sm">
                          {savedSelection.map(item => (
                            <div 
                              key={item.order} 
                              className={`flex items-start justify-between p-2 rounded ${
                                item.weight === 0 
                                  ? 'bg-gray-200 dark:bg-gray-800 opacity-60' 
                                  : 'bg-white dark:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-start flex-1">
                                <span className="font-medium text-indigo-600 dark:text-indigo-400 mr-2">{item.order}.</span>
                                <span className={`${
                                  item.weight === 0 
                                    ? 'text-gray-500 dark:text-gray-500 line-through' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {item.basename}
                                </span>
                              </div>
                              <span className={`ml-3 px-2 py-1 rounded text-xs font-mono ${
                                item.weight === 0
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {item.weight.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    */}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    No image available
                  </div>
                )}

              </div>

              {/* Right side - Match Images - Draggable */}
              <div>
                {matchImages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 dark:text-gray-200">
                      Matched Pottery Images
                      <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(drag to reorder)</span>
                    </h4>
                    <div className="grid grid-cols-[repeat(auto-fill,256px)] gap-4">
                      {matchImages.map((match, index) => (
                        <div 
                          key={`${match.key}-${index}`}
                          className={`relative ${draggedIndex === index ? 'opacity-50' : ''}`}
                        >
                          {/* Show placeholder overlay if it's the drop target */}
                          {draggedOverIndex === index && draggedIndex !== null && draggedIndex !== index && (
                            <div className="absolute inset-0 -left-2 border-l-4 border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg animate-pulse pointer-events-none z-10">
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
                                <div className="bg-indigo-500 dark:bg-indigo-400 rounded-full p-1">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* The actual image panel */}
                          <ImagePanel
                            match={match}
                            index={index}
                            isGrayed={grayedImages.has(index)}
                            onToggleGray={toggleGray}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            onMoveUp={handleMoveUp}
                            onMoveDown={handleMoveDown}
                            isFirst={index === 0}
                            isLast={index === matchImages.length - 1}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          )}
        </div>
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={cancelDelete}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-semibold mb-1 dark:text-gray-100">Delete submission</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Are you sure you want to delete record #{recordToDelete?.id}? This action cannot be undone.</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className={`px-3 py-2 rounded text-white text-sm ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
      <Footer />
    </>
  )
}
