import React, { useState } from 'react'
import { Sparkles, Hash, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

const BlogTitles = () => {
  const blogCategories = ['General', 'Technology', 'Health', 'Business', 'Travel', 'Food', 'Lifestyle', 'Education']

  const [selectedCategory, setSelectedCategory] = useState('General')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [titles, setTitles] = useState([])
  const [error, setError] = useState('')

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTitles([])

    try {
      const token = await getToken()

      const response = await fetch('http://localhost:3000/api/ai/generate-blog-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: `Generate 5 creative blog titles for keyword: "${input}" in category: "${selectedCategory}". Return only the titles as a numbered list.`
        })
      })

      const data = await response.json()

      if (data.success) {
        console.log('RAW CONTENT:', data.content)
        // Split content into individual titles
        const titleList = data.content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 3)
          .map(line => line.replace(/^[\d\.\-\*\#]+\s*/, '').trim())
          .filter(line => line.length > 3)
        setTitles(titleList)
      } else {
        setError(data.message || 'Something went wrong')
      }

    } catch (err) {
      setError('Failed to connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* Left col */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#8E37EB]" />
          <h1 className="text-xl font-semibold">AI Title Generator</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Keyword</p>
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="The future of artificial intelligence is..."
          required
        />

        <p className="mt-4 text-sm font-medium">Category</p>
        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {blogCategories.map((item) => (
            <span
              onClick={() => setSelectedCategory(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item ? 'bg-purple-50 text-purple-700' : 'text-gray-500 border-gray-300'}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>

        <br />
        <button
          disabled={loading}
          className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#C341F6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60'
        >
          {loading
            ? <><Loader2 className='w-5 animate-spin' /> Generating...</>
            : <><Hash className='w-5' /> Generate title</>
          }
        </button>
      </form>

      {/* Right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96'>

        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold'>Generated titles</h1>
        </div>

        <div className='flex-1 flex justify-center items-center mt-4'>

          {/* Loading state */}
          {loading && (
            <div className='flex flex-col items-center gap-3 text-gray-400'>
              <Loader2 className='w-9 h-9 animate-spin text-[#8E37EB]' />
              <p className='text-sm'>Generating your titles...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className='w-full p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          )}

          {/* Titles list */}
          {!loading && !error && titles.length > 0 && (
            <div className='w-full flex flex-col gap-3'>
              {titles.map((title, index) => (
                <div
                  key={index}
                  className='flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors'
                  onClick={() => navigator.clipboard.writeText(title)}
                  title='Click to copy'
                >
                  <span className='text-xs font-bold text-purple-600 mt-0.5'>
                    {index + 1}
                  </span>
                  <p className='text-sm text-slate-700'>{title}</p>
                </div>
              ))}
              <p className='text-xs text-gray-400 text-center mt-2'>
                Click any title to copy it
              </p>
            </div>
          )}

          {/* Placeholder */}
          {!loading && !error && titles.length === 0 && (
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <Hash className='w-9 h-9' />
              <p>Enter a keyword and click "Generate title" to get started</p>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

export default BlogTitles