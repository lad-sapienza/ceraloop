import React, { useEffect, useState } from 'react'
import { fetchFieldMetadata, parseFieldOptions } from '../utils/directusFields'
import { toast } from './Toaster'

/**
 * DynamicForm: A reusable form component that renders fields dynamically
 * based on Directus collection schema.
 * 
 * @param {Object} props
 * @param {import('axios').AxiosInstance} props.api - Axios API instance
 * @param {string} props.collection - Collection name (e.g., 'user_information')
 * @param {string|null} props.recordId - Existing record ID for updates, null for create
 * @param {Object} props.initialData - Initial form data
 * @param {Function} props.onSuccess - Callback after successful save (recordId, data)
 * @param {Function} props.onError - Callback on error (error)
 * @param {Array<string>} props.excludeFields - Fields to exclude from the form
 * @param {string} props.submitLabel - Custom submit button label
 * @param {boolean} props.showCancelButton - Whether to show cancel button
 * @param {Function} props.onCancel - Cancel callback
 */
export default function DynamicForm({
  api,
  collection,
  recordId = null,
  initialData = {},
  onSuccess,
  onError,
  excludeFields = [],
  submitLabel = 'Save',
  showCancelButton = false,
  onCancel,
}) {
  const [fieldDefs, setFieldDefs] = useState({})
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load field metadata on mount
  useEffect(() => {
    async function loadFieldMetadata() {
      try {
        setLoading(true)
        const fields = await fetchFieldMetadata(api, collection)
        setFieldDefs(fields)
        
        // Initialize form data with defaults if not provided
        const merged = { ...initialData }
        Object.values(fields).forEach(field => {
          if (merged[field.field] === undefined && field.defaultValue !== undefined) {
            merged[field.field] = field.defaultValue
          }
        })
        setFormData(merged)
      } catch (err) {
        console.error('Failed to load field metadata:', err)
        setError(err.message || 'Failed to load form fields')
        toast.error('Failed to load form fields')
      } finally {
        setLoading(false)
      }
    }
    loadFieldMetadata()
  }, [api, collection])

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...initialData }))
  }, [initialData])

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      let response
      if (recordId) {
        // Update existing record
        response = await api.patch(`/items/${collection}/${recordId}`, formData)
        toast.success('Updated successfully')
      } else {
        // Create new record
        response = await api.post(`/items/${collection}`, formData)
        toast.success('Created successfully')
      }
      
      const savedData = response.data?.data || response.data
      if (onSuccess) {
        onSuccess(savedData?.id || recordId, savedData)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.message 
        || err.response?.data?.message 
        || err.message 
        || 'Failed to save'
      setError(errorMsg)
      toast.error(errorMsg)
      if (onError) {
        onError(err)
      }
    } finally {
      setSaving(false)
    }
  }

  const renderField = (fieldDef) => {
    const { field, interface: iface, required, options, note, readonly } = fieldDef
    const value = formData[field]
    
    // Skip excluded, hidden, system fields, and readonly in create mode
    if (
      excludeFields.includes(field) ||
      fieldDef.hidden ||
      field.startsWith('_') ||
      (readonly && !recordId)
    ) {
      return null
    }
    
    const label = options?.label || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const placeholder = options?.placeholder || ''
    
    const commonClasses = 'input w-full dark:bg-slate-700 dark:text-gray-100 dark:border-gray-600'
    
    // Render based on interface type
    switch (iface) {
      case 'select-dropdown': {
        const opts = parseFieldOptions(fieldDef)
        return (
          <div key={field} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
            <select
              value={value || ''}
              onChange={e => handleChange(field, e.target.value)}
              required={required}
              disabled={readonly}
              className={commonClasses}
            >
              {opts.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )
      }
      
      case 'select-multiple-checkbox':
      case 'select-multiple-dropdown': {
        const opts = parseFieldOptions(fieldDef)
        const selected = Array.isArray(value) ? value : []
        return (
          <div key={field} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {note && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{note}</p>}
            <div className="space-y-2">
              {opts.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    disabled={readonly}
                    onChange={e => {
                      const next = e.target.checked
                        ? [...selected, opt.value]
                        : selected.filter(v => v !== opt.value)
                      handleChange(field, next)
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )
      }
      
      case 'input-multiline':
      case 'textarea': {
        return (
          <div key={field} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
            <textarea
              value={value || ''}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={placeholder}
              required={required}
              disabled={readonly}
              rows={options?.rows || 4}
              className={commonClasses}
            />
          </div>
        )
      }
      
      case 'input-rich-text-html':
      case 'input-rich-text-md': {
        // Fallback to textarea for rich text (you can enhance this later)
        return (
          <div key={field} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
            <textarea
              value={value || ''}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={placeholder}
              required={required}
              disabled={readonly}
              rows={6}
              className={commonClasses}
            />
          </div>
        )
      }
      
      case 'input':
      default: {
        // Text input
        const inputType = fieldDef.type === 'integer' || fieldDef.type === 'bigInteger' 
          ? 'number' 
          : fieldDef.type === 'date' 
          ? 'date' 
          : fieldDef.type === 'time'
          ? 'time'
          : fieldDef.type === 'timestamp' || fieldDef.type === 'datetime'
          ? 'datetime-local'
          : 'text'
          
        return (
          <div key={field} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {note && <p className="text-xs text-gray-500 dark:text-gray-400">{note}</p>}
            <input
              type={inputType}
              value={value || ''}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={placeholder}
              required={required}
              disabled={readonly}
              className={commonClasses}
            />
          </div>
        )
      }
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="dark:text-gray-300">Loading form...</span>
        </div>
      </div>
    )
  }

  if (error && Object.keys(fieldDefs).length === 0) {
    return (
      <div className="card">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  // Get sortable, visible fields
  const visibleFields = Object.values(fieldDefs)
    .filter(f => !f.hidden && !f.field.startsWith('_') && !excludeFields.includes(f.field))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {visibleFields.map(field => renderField(field))}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
        </div>
      )}
      
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className={`btn-primary ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
        
        {showCancelButton && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
