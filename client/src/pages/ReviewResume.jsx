import { FileText, Sparkles, Loader2 } from 'lucide-react';
import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.5.207/pdf.worker.min.mjs`;


const ReviewResume = () => {
  const [input, setInput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const { getToken } = useAuth()

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!input) {
      setError('Please upload a PDF resume before submitting.')
      return
    }

    setLoading(true)
    setError('')
    setContent('')

    try {
      // Extract text from PDF using pdfjs-dist
      const arrayBuffer = await input.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let extractedText = ''
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item) => item.str).join(' ')
        extractedText += pageText + '\n\n'
      }

      const resumeText = `File name: ${input.name}\n\n${extractedText}`

      const token = await getToken()

      const response = await fetch('http://localhost:3000/api/ai/review-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeText
        })
      })

      const data = await response.json()

      if (data.success) {
        setContent(data.content)
      } else {
        setError(data.message || 'Something went wrong while reviewing the resume.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to process resume. Make sure the PDF is valid and the server is running.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* left col */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Resume Review</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Upload Resume</p>

        <input onChange={(e) => setInput(e.target.files[0] || null)}
          type="file" accept='application/pdf'
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />
        <p className='text-xs text-gray-500 font-light mt-1'>
          Supports PDF resume only.
        </p>
        <button className='w-full flex justify-center items-center gap-2
bg-gradient-to-r from-[#00DA83] to-[#009BB3] text-white px-4 py-2 mt-6
text-sm rounded-lg cursor-pointer'>
          <FileText className='w-5' />
          Review Resume
        </button>


      </form>

      {/* Right col */}
      <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border
border-gray-200 min-h-96 max-h-[600px]'>

        <div className='flex items-center gap-3'>
          <FileText className='w-5 h-5 text-[#00DA83]' />
          <h1 className='text-xl font-semibold'>Analysis Result</h1>
        </div>

        <div className='flex-1 flex justify-center items-center overflow-y-auto mt-4'>

          {/* Loading state */}
          {loading && (
            <div className='flex flex-col items-center gap-3 text-gray-400'>
              <Loader2 className='w-9 h-9 animate-spin text-[#00DA83]' />
              <p className='text-sm'>Analyzing your resume...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className='w-full p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600 whitespace-pre-wrap'>{error}</p>
            </div>
          )}

          {/* Content state */}
          {!loading && !error && content && (
            <div className='w-full text-sm text-slate-700 whitespace-pre-wrap leading-relaxed overflow-y-auto'>
              {content}
            </div>
          )}

          {/* Placeholder state */}
          {!loading && !error && !content && (
            <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
              <FileText className='w-9 h-9' />
              <p>Upload a PDF resume and click "Review resume" to get started</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default ReviewResume
