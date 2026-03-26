import { Sparkles, Edit, Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const WriteArticle = () => {

  const articlelength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' }
  ]

  const [selectedLength, setSelectedLength] = useState(articlelength[0])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setContent('')

    try {
      const token = await getToken()

      const response = await fetch('http://localhost:3000/api/ai/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: input,
          length: selectedLength.length
        })
      })

      const data = await response.json()

      if (data.success) {
        setContent(data.content)
      } else {
        setError(data.message || 'Something went wrong')
      }

    } catch {
      setError('Failed to connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* Left col */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Article Configuration</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Article Topic</p>
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="The future of artificial intelligence is..."
          required
        />

        <p className="mt-4 text-sm font-medium">Article Length</p>
        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {articlelength.map((item, index) => (
            <span
              onClick={() => setSelectedLength(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedLength.text === item.text ? 'bg-blue-50 text-blue-700' : 'text-gray-500 border-gray-300'}`}
              key={index}
            >
              {item.text}
            </span>
          ))}
        </div>

        <br />
        <button
          disabled={loading}
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#226BFF] to-[#65ADFF] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60'
        >
          {loading
            ? <><Loader2 className='w-5 animate-spin' /> Generating...</>
            : <><Edit className='w-5' /> Generate article</>
          }
        </button>
      </form>

      {/* Right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 min-h-[600px]'>

        <div className='flex items-center gap-3'>
          <Edit className='w-5 h-5 text-[#4A7AFF]' />
          <h1 className='text-xl font-semibold'>Generated article</h1>
        </div>

        <div className='flex-1 flex justify-center items-center overflow-y-auto mt-4'>

          {/* Loading state */}
          {loading && (
            <div className='flex flex-col items-center gap-3 text-gray-400'>
              <Loader2 className='w-9 h-9 animate-spin text-[#4A7AFF]' />
              <p className='text-sm'>Generating your article...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className='w-full p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {/* Content state */}
          {!loading && !error && content && (
            <div className='w-full text-sm text-slate-700 leading-relaxed overflow-y-auto max-h-[500px] p-2'>
              {content}
            </div>
          )}

          {/* Placeholder state */}
          {!loading && !error && !content && (
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <Edit className='w-9 h-9' />
              <p>Enter a topic and click "Generate article" to get started</p>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

export default WriteArticle