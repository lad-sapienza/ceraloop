/**
 * EXAMPLE: Dynamic form generation using Directus field metadata
 * 
 * This file demonstrates how to fetch field definitions from Directus
 * and render form fields dynamically instead of hardcoding them.
 * 
 * To use this approach in AboutMe.jsx:
 * 
 * 1. Import the utilities:
 *    import { fetchFieldMetadata, parseFieldOptions } from '../utils/directusFields'
 * 
 * 2. Add state for field metadata:
 *    const [fieldDefs, setFieldDefs] = useState({})
 * 
 * 3. Fetch metadata on mount:
 *    useEffect(() => {
 *      async function loadFieldMetadata() {
 *        try {
 *          const fields = await fetchFieldMetadata(api, 'user_information')
 *          setFieldDefs(fields)
 *        } catch (err) {
 *          console.error('Failed to load field metadata:', err)
 *        }
 *      }
 *      loadFieldMetadata()
 *    }, [])
 * 
 * 4. Use metadata to render form fields:
 *    const eduField = fieldDefs.educational_qualification
 *    if (eduField?.interface === 'select-multiple-checkbox') {
 *      const options = parseFieldOptions(eduField)
 *      // Render checkboxes using options
 *    }
 * 
 * Benefits:
 * - Changes to field types/options in Directus admin automatically reflect in the UI
 * - No need to hardcode EDU_OPTIONS or EXP_OPTIONS
 * - Field labels, help text, validation rules all come from Directus
 * - Easy to add new fields without code changes
 * 
 * Example API response from GET /fields/user_information:
 * 
 * {
 *   "data": [
 *     {
 *       "collection": "user_information",
 *       "field": "educational_qualification",
 *       "type": "json",
 *       "schema": { ... },
 *       "meta": {
 *         "interface": "select-multiple-checkbox",
 *         "options": {
 *           "choices": [
 *             { "text": "None", "value": "None" },
 *             { "text": "Bachelor's Degree", "value": "Bachelor's Degree" },
 *             { "text": "Master's Degree", "value": "Master's Degree" },
 *             { "text": "PhD", "value": "PhD" }
 *           ]
 *         },
 *         "required": true,
 *         "note": "Select all that apply"
 *       }
 *     },
 *     {
 *       "field": "experience_in_archaeology",
 *       "type": "string",
 *       "meta": {
 *         "interface": "select-dropdown",
 *         "options": {
 *           "choices": [
 *             { "text": "none", "value": "0" },
 *             { "text": "up to 5 years", "value": "5" },
 *             { "text": "up to 10 years", "value": "10" },
 *             { "text": "more than 10 years", "value": "10+" }
 *           ]
 *         }
 *       }
 *     }
 *   ]
 * }
 * 
 * Security note:
 * - The /fields endpoint requires authentication
 * - Only returns fields the current user's role has access to
 * - Sensitive fields can be hidden via field permissions in Directus
 */

import React, { useEffect, useState } from 'react'
import { fetchFieldMetadata, parseFieldOptions } from '../utils/directusFields'
import api from '../services/api'

export default function DynamicFormExample() {
  const [fields, setFields] = useState({})
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Fetch field metadata from Directus
        const fieldDefs = await fetchFieldMetadata(api, 'user_information')
        setFields(fieldDefs)
        
        // Initialize form with default values
        const initial = {}
        Object.values(fieldDefs).forEach(field => {
          if (field.defaultValue !== undefined) {
            initial[field.field] = field.defaultValue
          }
        })
        setFormData(initial)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  if (loading) return <div>Loading form...</div>

  // Get sortable, visible fields
  const visibleFields = Object.values(fields)
    .filter(f => !f.hidden && !f.field.startsWith('_'))
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))

  return (
    <form className="space-y-4">
      {visibleFields.map(field => {
        const value = formData[field.field]
        
        // Render based on interface type
        switch (field.interface) {
          case 'select-dropdown': {
            const options = parseFieldOptions(field)
            return (
              <div key={field.field}>
                <label className="block text-sm font-medium mb-1">
                  {field.options?.label || field.field}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.note && <p className="text-xs text-gray-500 mb-2">{field.note}</p>}
                <select
                  value={value || ''}
                  onChange={e => handleChange(field.field, e.target.value)}
                  required={field.required}
                  className="input w-full"
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )
          }
          
          case 'select-multiple-checkbox': {
            const options = parseFieldOptions(field)
            const selected = Array.isArray(value) ? value : []
            return (
              <div key={field.field}>
                <label className="block text-sm font-medium mb-1">
                  {field.options?.label || field.field}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.note && <p className="text-xs text-gray-500 mb-2">{field.note}</p>}
                <div className="space-y-2">
                  {options.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(opt.value)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...selected, opt.value]
                            : selected.filter(v => v !== opt.value)
                          handleChange(field.field, next)
                        }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          }
          
          case 'input-multiline':
          case 'textarea': {
            return (
              <div key={field.field}>
                <label className="block text-sm font-medium mb-1">
                  {field.options?.label || field.field}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.note && <p className="text-xs text-gray-500 mb-2">{field.note}</p>}
                <textarea
                  value={value || ''}
                  onChange={e => handleChange(field.field, e.target.value)}
                  required={field.required}
                  rows={field.options?.rows || 4}
                  className="input w-full"
                />
              </div>
            )
          }
          
          default: {
            return (
              <div key={field.field}>
                <label className="block text-sm font-medium mb-1">
                  {field.options?.label || field.field}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.note && <p className="text-xs text-gray-500 mb-2">{field.note}</p>}
                <input
                  type="text"
                  value={value || ''}
                  onChange={e => handleChange(field.field, e.target.value)}
                  required={field.required}
                  className="input w-full"
                />
              </div>
            )
          }
        }
      })}
      
      <button type="submit" className="btn-primary">
        Save
      </button>
    </form>
  )
}
