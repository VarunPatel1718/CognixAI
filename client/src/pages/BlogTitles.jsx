import React, { useState } from 'react'
import { Sparkles, Hash, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import API_BASE_URL from '../config.js'

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

      const response = await fetch(`${API_BASE_URL}/api/ai/generate-blog-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: `Generate 5 creative blog titles for keyword: "${input}" in category: "${selectedCategory}". Return only titles as a numbered list.`
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
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 rounded-xl" style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px'
      }}>
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#8E37EB]" />
          <h1 className="text-xl font-semibold">AI Title Generator</h1>
        </div>

        <p className="mt-6 text-sm font-medium text-slate-300">Keyword</p>
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-lg text-slate-200 placeholder-slate-500"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          placeholder="The future of artificial intelligence is..."
          required
        />

        <p className="mt-4 text-sm font-medium text-slate-300">Category</p>
        <div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
          {blogCategories.map((item) => (
            <span
              onClick={() => setSelectedCategory(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' : 'text-slate-400 border-slate-700'}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>

        <br />
        <button
          disabled={loading}
          className='w-full flex justify-center items-center gap-2 text-white px-4 py-3 mt-6 text-sm rounded-xl cursor-pointer disabled:opacity-60'
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
          }}
        >
          {loading
            ? <><Loader2 className='w-5 animate-spin' /> Generating...</>
            : <><Hash className='w-5' /> Generate title</>
          }
        </button>
      </form>

      {/* Right col */}
      <div className='w-full max-w-lg p-4 rounded-xl flex flex-col' style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>

        <div className='flex items-center gap-3'>
          <Hash className='w-5 h-5 text-[#8E37EB]' />
          <h1 className='text-xl font-semibold text-slate-200'>Generated titles</h1>
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
                  className='flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors'
                  style={{
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.2)'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(title)
                      .then(() => alert('Title copied to clipboard!'))
                      .catch(() => {
                        const el = document.createElement('textarea')
                        el.value = title
                        document.body.appendChild(el)
                        el.select()
                        document.execCommand('copy')
                        document.body.removeChild(el)
                        alert('Title copied!')
                      })
                  }}
                  title='Click to copy'
                >
                  <span className='text-xs font-bold text-purple-400 mt-0.5'>
                    {index + 1}
                  </span>
                  <p className='text-sm text-slate-200'>{title}</p>
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