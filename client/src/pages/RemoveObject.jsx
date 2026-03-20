import React, { useState } from 'react'
import { Sparkles, Eraser, Scissors, Wrench, Clock } from 'lucide-react'

const RemoveObject = () => {
  const [input, setInput] = useState('')
  const [object, setObject] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [originalPreview, setOriginalPreview] = useState('')

  // Handle file upload and create preview
  const handleFileUpload = async (file) => {
    if (!file) return
    
    setInput(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    
    if (!input || !object) {
      setMessage('Please upload an image and specify the object to remove.')
      return
    }

    setLoading(true)
    setMessage('')

    // Simulate API call with coming soon message
    setTimeout(() => {
      setLoading(false)
      setMessage({
        success: false,
        message: "Object removal feature coming soon! We are integrating a powerful AI model for this feature."
      })
    }, 1500)
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* left col */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Object Remover</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Upload image</p>

        <input onChange={(e) => handleFileUpload(e.target.files[0])}
          type="file" accept='image/*'
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />

        {/* Original image preview */}
        {originalPreview && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Original Image</p>
            <img 
              src={originalPreview} 
              alt="Original" 
              className="w-full rounded-lg border border-gray-200"
            />
          </div>
        )}

        <p className="mt-6 text-sm font-medium">Describe object name to remove</p>

        <textarea onChange={(e) => setObject(e.target.value)} value={object} rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="e.g., remove person, remove car, Only single object name..."
          required
        />
        <button 
          type="submit"
          disabled={loading}
          className='w-full flex justify-center items-center gap-2
bg-gradient-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6
text-sm rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'>
          {loading ? (
            <>
              <Scissors className='w-5 animate-spin' />
              Processing...
            </>
          ) : (
            <>
              <Scissors className='w-5' />
              Remove object
            </>
          )}
        </button>

        {/* Message display */}
        {message && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600">
              {typeof message === 'string' ? message : message.message}
            </p>
          </div>
        )}

      </form>

      {/* Right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border
border-gray-200 min-h-96'>

        <div className='flex items-center gap-3'>
          <Wrench className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Object Removal Status</h1>
        </div>

        <div className='flex-1 flex justify-center items-center'>
          {/* Loading state */}
          {loading && (
            <div className='flex flex-col items-center gap-4 text-gray-600'>
              <Scissors className='w-12 h-12 animate-spin text-[#4A7AFF]' />
              <p className='text-sm'>Processing request...</p>
            </div>
          )}

          {/* Coming Soon state */}
          {!loading && message && typeof message === 'object' && !message.success && (
            <div className='text-center space-y-6'>
              <div className='w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto'>
                <Clock className='w-10 h-10 text-blue-600' />
              </div>
              <div className='space-y-3'>
                <h2 className='text-2xl font-bold text-gray-800'>Coming Soon</h2>
                <p className='text-gray-600 max-w-sm mx-auto'>
                  We're integrating a powerful AI model for object removal. 
                  This feature will be available shortly!
                </p>
                <div className='flex items-center justify-center gap-2 text-sm text-blue-600'>
                  <Wrench className='w-4 h-4' />
                  <span>Advanced AI Integration in Progress</span>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder state */}
          {!loading && !message && (
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <Scissors className='w-9 h-9' />
              <p>Upload an image and click "Remove object" to get started</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default RemoveObject
