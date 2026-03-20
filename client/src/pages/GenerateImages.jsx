import React, { useState } from 'react'
import { Sparkles, Hash, Image, Download, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

const GenerateImages = () => {
  const imageStyle = [
    'Realistic',
    'Ghibli style',
    'Anime style',
    'Cartoon style',
    'Fantasy style',
    '3D style',
    'Portrait style'
  ]

  const [selectedStyle, setSelectedStyle] = useState('Realistic')
  const [input, setInput] = useState('')
  const [publish, setPublish] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const { getToken } = useAuth()

  const downloadImage = async () => {
    try {
      // Fetch the image as a blob to handle cross-origin Cloudinary URLs
      const response = await fetch(content)
      const blob = await response.blob()
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = url
      link.download = 'generated-image.png'
      
      // Trigger the download
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      // Fallback to simple download if blob method fails
      const link = document.createElement('a')
      link.href = content
      link.download = 'generated-image.png'
      link.target = '_blank'
      link.click()
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) {
      setError('Please enter a description for the image.')
      return
    }

    setLoading(true)
    setError('')
    setContent('')

    try {
      const token = await getToken()
      
      const payload = { 
        prompt: input + " " + selectedStyle, 
        publish: publish 
      }
      
      console.log('Frontend Payload:', payload)
      
      const response = await fetch('http://localhost:3000/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('Backend Response:', data)

      if (data.success) {
        setContent(data.content)
      } else {
        setError(data.message || 'Failed to generate image.')
      }
    } catch (err) {
      console.error('Frontend Error:', err)
      setError('Failed to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* left col */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Describe Your Image</p>

        <textarea onChange={(e) => setInput(e.target.value)} value={input} rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="Describe what you want to see in image..."
          required
        />
        <p className="mt-4 text-sm font-medium">Style</p>
        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {imageStyle.map((item) => (
            <span onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedStyle === item ? 'bg-green-50 text-green-700' : 'text-gray-500 border-gray-300'}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
        <div className='my-6 flex items-center gap-2'>
          <label className='relative cursor-pointer'>
            <input
              type='checkbox'
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className='sr-only peer'
            />

            <div className='w-9 h-5 bg-slate-300 rounded-full
      peer-checked:bg-green-500 transition'></div>

            <span className='absolute left-1 top-1 w-3 h-3 bg-white
      rounded-full transition peer-checked:translate-x-4'></span>
          </label>

          <p className='text-sm'>Make this image Public</p>
        </div>
        <button 
          type="submit"
          disabled={loading}
          className='w-full flex justify-center items-center gap-2
bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white px-4 py-2 mt-6
text-sm rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'>
          {loading ? (
            <>
              <Loader2 className='w-5 animate-spin' />
              Generating...
            </>
          ) : (
            <>
              <Image className='w-5' />
              Generate Image
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

      </form>

      {/* Right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border
border-gray-200 min-h-96'>

        <div className='flex items-center gap-3'>
          <Image className='w-5 h-5 text-[#00AD25]' />
          <h1 className='text-xl font-semibold'>Generated images</h1>
        </div>

        <div className='flex-1 flex justify-center items-center'>
          {/* Loading state */}
          {loading && (
            <div className='text-center space-y-4'>
              <Loader2 className='w-12 h-12 animate-spin text-[#00AD25] mx-auto' />
              <p className='text-sm text-gray-600 mt-2'>
                Generating your image... this may take 30-60 seconds
              </p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className='w-full p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600 text-center'>{error}</p>
            </div>
          )}

          {/* Content state */}
          {!loading && !error && content && (
            <div className='w-full space-y-4'>
              <div className='relative'>
                <img 
                  src={content} 
                  alt="Generated" 
                  className="w-full rounded-lg border border-gray-200"
                />
                {publish && (
                  <div className='absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full'>
                    Published to Community!
                  </div>
                )}
              </div>
              <button
                onClick={downloadImage}
                className='w-full flex justify-center items-center gap-2
bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2
text-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity'
              >
                <Download className='w-4 h-4' />
                Download Image
              </button>
            </div>
          )}

          {/* Placeholder state */}
          {!loading && !error && !content && (
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <Image className='w-9 h-9' />
              <p>Enter a topic and click "Generate image" to get started</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default GenerateImages
