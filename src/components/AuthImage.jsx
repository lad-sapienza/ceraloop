import React, { useEffect, useState } from 'react'
import api from '../services/api'

// Component to display images by looking up UUID first
function AuthImage({ filename, alt, className }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    async function loadImage() {
      try {
        const baseUrl = import.meta.env.VITE_DIRECTUS_URL.replace(/\/$/, '')
        
        // Query the files collection to find the UUID for this filename
        const filesResponse = await api.get('/files', {
          params: {
            'filter[filename_download][_eq]': filename,
            fields: 'id,filename_download',
            limit: 1
          }
        })
        
        const file = (filesResponse.data?.data || filesResponse.data)?.[0]
        
        if (!file || !file.id) {
          throw new Error(`File not found: ${filename}`)
        }

        // Now fetch the image using the UUID
        const imageUrl = `${baseUrl}/assets/${file.id}/${filename}`
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${(await import('../services/auth')).getAccessToken()}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }
        
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        setImageSrc(objectUrl)
      } catch (err) {
        console.error(`Failed to load image ${filename}:`, err)
        setImageError(true)
      }
    }
    loadImage()

    // Cleanup blob URL on unmount
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc)
    }
  }, [filename])

  if (imageError) {
    return (
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs p-2">
        <span className="text-center">{filename}</span>
      </div>
    )
  }

  if (!imageSrc) {
    return (
      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-xs animate-pulse">
        Loading...
      </div>
    )
  }

  return <img src={imageSrc} alt={alt} className={className} />
}

export default AuthImage
