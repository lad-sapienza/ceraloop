/**
 * Fetch field metadata from Directus for a given collection.
 * Returns field definitions including type, interface, options, validation, etc.
 * Uses sessionStorage for caching to avoid repeated API calls.
 * 
 * @param {import('axios').AxiosInstance} api - The Axios API instance
 * @param {string} collection - The collection name (e.g., 'user_information')
 * @param {Object} options - Options for fetching
 * @param {boolean} options.skipCache - If true, bypass cache and fetch fresh
 * @returns {Promise<Object>} Field definitions keyed by field name
 */
export async function fetchFieldMetadata(api, collection, options = {}) {
  const { skipCache = false } = options
  const cacheKey = `directus_fields_${collection}`
  
  // Try to load from cache first
  if (!skipCache && typeof sessionStorage !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        // Check if cache is still valid (within 1 hour)
        const age = Date.now() - (parsed.timestamp || 0)
        if (age < 3600000) { // 1 hour in ms
          console.log(`Using cached field metadata for ${collection}`)
          return parsed.data
        }
      }
    } catch (err) {
      // Ignore cache errors, fetch fresh
      console.warn('Cache read error:', err)
    }
  }
  
  try {
    // Fetch all fields for the collection
    // Directus endpoint: GET /fields/:collection
    const res = await api.get(`/fields/${collection}`)
    const fields = res.data?.data || res.data || []
    
    // Transform into a keyed object for easy lookup
    const fieldMap = {}
    fields.forEach(field => {
      fieldMap[field.field] = {
        field: field.field,
        type: field.type,           // e.g., 'string', 'integer', 'json', 'text'
        interface: field.meta?.interface, // e.g., 'input', 'select-dropdown', 'select-multiple-checkbox'
        required: field.meta?.required || false,
        options: field.meta?.options || {},  // Interface-specific options (e.g., choices for dropdown)
        note: field.meta?.note || null,      // Admin notes/help text
        hidden: field.meta?.hidden || false,
        readonly: field.meta?.readonly || false,
        validation: field.schema?.validation || null,
        defaultValue: field.schema?.default_value,
        width: field.meta?.width || 'full',
        sort: field.meta?.sort || 0,
      }
    })
    
    // Store in cache
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: fieldMap
        }))
      } catch (err) {
        // Ignore cache write errors (e.g., quota exceeded)
        console.warn('Cache write error:', err)
      }
    }
    
    return fieldMap
  } catch (err) {
    console.error('Failed to fetch field metadata:', err)
    throw err
  }
}

/**
 * Clear cached field metadata for a collection or all collections.
 * 
 * @param {string|null} collection - Collection name, or null to clear all
 */
export function clearFieldCache(collection = null) {
  if (typeof sessionStorage === 'undefined') return
  
  if (collection) {
    sessionStorage.removeItem(`directus_fields_${collection}`)
  } else {
    // Clear all field caches
    const keys = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('directus_fields_')) {
        keys.push(key)
      }
    }
    keys.forEach(key => sessionStorage.removeItem(key))
  }
}

/**
 * Parse choices/options from Directus field metadata.
 * Handles both array of strings and array of {text, value} objects.
 * 
 * @param {Object} fieldDef - The field definition from fetchFieldMetadata
 * @returns {Array<{label: string, value: string}>} Normalized options
 */
export function parseFieldOptions(fieldDef) {
  const choices = fieldDef.options?.choices || []
  
  if (!Array.isArray(choices)) return []
  
  return choices.map(choice => {
    if (typeof choice === 'string') {
      return { label: choice, value: choice }
    }
    if (typeof choice === 'object' && choice !== null) {
      return {
        label: choice.text || choice.label || choice.value || '',
        value: String(choice.value ?? '')
      }
    }
    return { label: '', value: '' }
  }).filter(opt => opt.value !== '')
}
