import React, { useState, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import API_BASE_URL from '../config.js'
import axios from 'axios'
import { Sparkles, Scissors, Download, Upload, Loader2 } from 'lucide-react'

const RemoveObject = () => {
  const { getToken } = useAuth()
  const [imagePreview, setImagePreview] = useState('')
  const [resultImage, setResultImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [objectName, setObjectName] = useState('')
  
  const fileInputRef = useRef(null)

  // Handle file upload with compression
  const handleFileUpload = (file) => {
    if (!file) return
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setError('')
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
      setResultImage('')
    }
    reader.readAsDataURL(file)
  }

  // Compress image if needed
  const compressImage = (base64, maxWidth = 1024, maxHeight = 1024, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = base64
    })
  }

  // Remove object using Hugging Face API
  const handleRemoveObject = async () => {
    try {
      if (!imagePreview) {
        setError('Please upload an image first')
        return
      }

      if (!objectName.trim()) {
        setError('Please describe what you want to remove')
        return
      }

      setLoading(true)
      setError('')
      
      // Compress image before sending
      const compressedImage = await compressImage(imagePreview)
      
      const token = await getToken()
      
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/remove-object`,
        {
          imageBase64: compressedImage,
          objectName: objectName.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      const data = response.data
      
      if (data.success) {
        setResultImage(data.content)
      } else {
        setError(data.message || 'Failed to remove object')
      }
    } catch (err) {
      setError('Failed to remove object: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Download result
  const downloadResult = () => {
    if (!resultImage) return
    
    const link = document.createElement('a')
    link.href = resultImage
    link.download = `removed-${objectName || 'object'}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Reset everything
  const handleReset = () => {
    setImagePreview('')
    setResultImage('')
    setObjectName('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-800">Remove Objects</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Upload and Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Image</h2>
            
            {/* File Upload */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-4">
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-auto"
                  />
                </div>

                {/* Object Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe what to remove (e.g., "person", "car", "background")
                  </label>
                  <input
                    type="text"
                    value={objectName}
                    onChange={(e) => setObjectName(e.target.value)}
                    placeholder="Enter object description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleRemoveObject}
                    disabled={loading || !objectName.trim()}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Scissors className="w-4 h-4" />
                        Remove Object
                      </>
                    )}
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>How it works:</strong><br/>
                    • Upload an image<br/>
                    • Describe what you want to remove<br/>
                    • AI will remove the object/background<br/>
                    • Download the result
                  </p>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!imagePreview && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">No image uploaded</p>
                <p className="text-gray-500 text-sm mt-1">Upload an image to get started</p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">❌ {error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Result */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Result</h2>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Removing object...</p>
                <p className="text-gray-500 text-sm mt-1">This may take a few seconds</p>
              </div>
            ) : resultImage ? (
              <div className="space-y-4">
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={resultImage}
                    alt="Result"
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={downloadResult}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Result
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Try Another Image
                  </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✅ <strong>Success!</strong> Object/background removed successfully. Download your result above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Scissors className="w-12 h-12 mb-4" />
                <p className="text-gray-600 font-medium">No result yet</p>
                <p className="text-gray-500 text-sm mt-1">Upload an image and describe what to remove</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemoveObject
