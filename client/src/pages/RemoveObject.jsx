import React, { useState, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { Sparkles, Scissors, Download, Eraser, Brush } from 'lucide-react'

const RemoveObject = () => {
  const { getToken } = useAuth()
  const [imagePreview, setImagePreview] = useState('')
  const [resultImage, setResultImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [brushSize, setBrushSize] = useState('medium')
  const [isDrawing, setIsDrawing] = useState(false)
  
  const canvasRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const brushSizes = {
    small: 5,
    medium: 15,
    large: 30
  }

  // Handle file upload
  const handleFileUpload = (file) => {
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
      setResultImage('')
      // Initialize canvas when image loads
      setTimeout(() => initializeCanvas(e.target.result), 100)
    }
    reader.readAsDataURL(file)
  }

  // Initialize canvas with image
  const initializeCanvas = (imageSrc) => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    const ctx = canvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')
    
    const img = new Image()
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width
      canvas.height = img.height
      maskCanvas.width = img.width
      maskCanvas.height = img.height
      
      // Draw image on main canvas
      ctx.drawImage(img, 0, 0)
      
      // Clear mask canvas (fill with black)
      maskCtx.fillStyle = 'black'
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    }
    img.src = imageSrc
  }

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  // Start drawing
  const startDrawing = (e) => {
    setIsDrawing(true)
    const pos = getMousePos(e)
    draw(pos.x, pos.y)
  }

  // Draw on canvas
  const draw = (x, y) => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    const ctx = canvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')
    
    const size = brushSizes[brushSize]
    
    // Draw red overlay on main canvas
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw white on mask canvas (this becomes the removal mask)
    maskCtx.fillStyle = 'white'
    maskCtx.beginPath()
    maskCtx.arc(x, y, size, 0, Math.PI * 2)
    maskCtx.fill()
  }

  // Continue drawing
  const continueDrawing = (e) => {
    if (!isDrawing) return
    const pos = getMousePos(e)
    draw(pos.x, pos.y)
  }

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false)
  }

  // Clear mask
  const clearMask = () => {
    if (!imagePreview) return
    
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    const ctx = canvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')
    
    // Redraw original image
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      // Clear mask canvas
      maskCtx.fillStyle = 'black'
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
    }
    img.src = imagePreview
  }

  // Get mask as base64
  const getMaskBase64 = () => {
    const maskCanvas = maskCanvasRef.current
    return maskCanvas.toDataURL('image/png')
  }

  // Remove object
  const handleRemoveObject = async () => {
    if (!imagePreview) {
      setError('Please upload an image first')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const token = await getToken()
      const maskBase64 = getMaskBase64()
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai/remove-object`,
        {
          imageBase64: imagePreview,
          maskBase64: maskBase64
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      setResultImage(response.data.content)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove object')
    } finally {
      setLoading(false)
    }
  }

  // Download result
  const downloadResult = () => {
    if (!resultImage) return
    
    const link = document.createElement('a')
    link.href = resultImage
    link.download = 'removed-object.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          {/* Left Panel - Drawing Canvas */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Image</h2>
            
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
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                📤 Upload Image
              </button>
            </div>

            {/* Canvas Container */}
            {imagePreview ? (
              <div className="space-y-4">
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={continueDrawing}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <canvas
                    ref={maskCanvasRef}
                    className="hidden"
                  />
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    🎨 <strong>Paint over the object you want to remove</strong><br/>
                    Click and drag to draw red areas over objects to remove
                  </p>
                </div>

                {/* Controls */}
                <div className="space-y-3">
                  {/* Brush Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brush Size
                    </label>
                    <div className="flex gap-2">
                      {Object.keys(brushSizes).map((size) => (
                        <button
                          key={size}
                          onClick={() => setBrushSize(size)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            brushSize === size
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={clearMask}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eraser className="w-4 h-4" />
                      Clear Mask
                    </button>
                    <button
                      onClick={handleRemoveObject}
                      disabled={loading}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Scissors className="w-4 h-4 animate-spin" />
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
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">❌ {error}</p>
                  </div>
                )}
              </div>
            ) : (
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
          </div>

          {/* Right Panel - Result */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Result</h2>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <Scissors className="w-12 h-12 text-green-500 animate-spin mb-4" />
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
                
                <button
                  onClick={downloadResult}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Result
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Scissors className="w-12 h-12 mb-4" />
                <p className="text-gray-600 font-medium">No result yet</p>
                <p className="text-gray-500 text-sm mt-1">Upload an image and paint over objects to remove</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RemoveObject
