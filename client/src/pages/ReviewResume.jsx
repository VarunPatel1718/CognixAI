import { FileText, Sparkles, Loader2, Download, TrendingUp, AlertCircle, Target } from 'lucide-react';
import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;


const ReviewResume = () => {
  const [error, setError] = useState('')
  const [pdfText, setPdfText] = useState('')
  const [processingFile, setProcessingFile] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState({
    strengths: '',
    improvements: '',
    keywords: '',
    ats_score: null
  })
  const [atsScore, setAtsScore] = useState(null)
  const [activeTab, setActiveTab] = useState('strengths')

  const { getToken } = useAuth()

  const handleFileUpload = async (file) => {
    if (!file) {
      setError('Please select a PDF file.')
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.')
      return
    }

    setProcessingFile(true)
    setError('')
    setPdfText('')

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let extractedText = ''
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item) => item.str).join(' ')
        extractedText += pageText + '\n\n'
      }

      // Clean up text to remove weird symbols and encoding issues
      let cleanedText = extractedText
        .replace(/[\u2018\u2019]/g, "'") // Normalize quotes
        .replace(/[\u201C\u201D]/g, '"') // Normalize double quotes
        .replace(/[\u2013\u2014]/g, '-') // Normalize dashes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
      
      // Remove control characters using string filtering
      cleanedText = cleanedText.split('').filter(char => 
        char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126 || 
        char.charCodeAt(0) > 127
      ).join('')

      const finalText = `File name: ${file.name}\n\n${cleanedText}`
      setPdfText(finalText)
    } catch (err) {
      console.error(err)
      if (err.name === 'PasswordException') {
        setError('This PDF is password protected. Please upload an unprotected PDF.')
      } else if (err.name === 'InvalidPDFException') {
        setError('Invalid PDF file. Please upload a valid PDF document.')
      } else {
        setError('Failed to process PDF. Please try again with a different file.')
      }
      setPdfText('')
    } finally {
      setProcessingFile(false)
    }
  }

  const analyzeResume = async () => {
    if (!pdfText) {
      setError('No PDF text to analyze. Please upload a PDF first.')
      return
    }

    setAnalyzing(true)
    setError('')
    setAnalysisResult({
      strengths: '',
      improvements: '',
      keywords: '',
      ats_score: null
    })

    try {
      const token = await getToken()

      const response = await fetch('http://localhost:3000/api/ai/review-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeText: pdfText
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Try to parse JSON response
        let parsedResult
        try {
          // If response is already an object, use it directly
          if (typeof data.content === 'object') {
            parsedResult = data.content
          } else if (typeof data.content === 'string') {
            // Try to parse as JSON string
            parsedResult = JSON.parse(data.content)
          } else {
            throw new Error('Invalid response format')
          }
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
          // Fallback: try to extract sections from text
          const content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
          const scoreMatch = content.match(/ATS Score:\s*(\d+)\/100/i)
          parsedResult = {
            strengths: content,
            improvements: '',
            keywords: '',
            ats_score: scoreMatch ? parseInt(scoreMatch[1]) : null
          }
        }

        setAnalysisResult(parsedResult)
        if (parsedResult.ats_score !== null) {
          setAtsScore(parsedResult.ats_score)
        }
      } else {
        setError(data.message || 'Something went wrong while analyzing resume.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to analyze resume. Make sure server is running and try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const downloadAsPDF = () => {
    // Create a temporary div with analysis content
    const element = document.createElement('div')
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #00DA83; margin-bottom: 20px;">Resume Analysis Report</h1>
        ${atsScore !== null ? `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 24px;">ATS Score: ${atsScore}/100</h2>
        </div>` : ''}
        ${analysisResult.strengths ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #16a34a; margin-bottom: 10px;">Strengths</h3>
          <div style="white-space: pre-wrap; line-height: 1.6;">${analysisResult.strengths}</div>
        </div>` : ''}
        ${analysisResult.improvements ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #ea580c; margin-bottom: 10px;">Areas for Improvement</h3>
          <div style="white-space: pre-wrap; line-height: 1.6;">${analysisResult.improvements}</div>
        </div>` : ''}
        ${analysisResult.keywords ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #2563eb; margin-bottom: 10px;">Keyword Suggestions</h3>
          <div style="white-space: pre-wrap; line-height: 1.6;">${analysisResult.keywords}</div>
        </div>` : ''}
      </div>
    `
    
    // Use browser's print functionality to save as PDF
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Resume Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { color: #00DA83; }
            .score-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* left col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">Resume Review</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Upload Resume</p>

        <input onChange={(e) => handleFileUpload(e.target.files[0] || null)}
          type="file" accept='application/pdf'
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />
        
        {/* File processing loading state */}
        {processingFile && (
          <div className='flex items-center gap-2 mt-2 text-sm text-gray-600'>
            <Loader2 className='w-4 h-4 animate-spin text-[#00DA83]' />
            <span>Processing PDF...</span>
          </div>
        )}
        <p className='text-xs text-gray-500 font-light mt-1'>
          Supports PDF resume only.
        </p>
        
        {/* Analyze Button */}
        {pdfText && !processingFile && (
          <button 
            type="button"
            onClick={analyzeResume}
            className='w-full flex justify-center items-center gap-2
            bg-gradient-to-r from-[#009BB3] to-[#00DA83] text-white px-4 py-2 mt-4
text-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity'
          >
            <Sparkles className='w-5' />
            Analyze Resume
          </button>
        )}
        


      </div>

      {/* Analysis Results Section */}
      <div className='w-full max-w-2xl p-6 bg-white rounded-lg flex flex-col border
border-gray-200 min-h-[600px]'>

        {/* ATS Score Badge */}
        {atsScore !== null && (
          <div className='flex justify-center mb-6'>
            <div className='relative'>
              <div className='w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white shadow-lg'>
                <span className='text-3xl font-bold'>{atsScore}</span>
                <span className='text-sm opacity-90'>/ 100</span>
              </div>
              <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-gray-200'>
                <span className='text-xs font-semibold text-gray-700'>ATS Score</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {analysisResult && (analysisResult.strengths || analysisResult.improvements || analysisResult.keywords) && (
          <div className='flex border-b border-gray-200 mb-6'>
            <button
              onClick={() => setActiveTab('strengths')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'strengths'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className='w-4 h-4 inline mr-2' />
              Strengths
            </button>
            <button
              onClick={() => setActiveTab('improvements')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'improvements'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertCircle className='w-4 h-4 inline mr-2' />
              Areas for Improvement
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'keywords'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className='w-4 h-4 inline mr-2' />
              Keyword Suggestions
            </button>
          </div>
        )}

        <div className='flex-1 overflow-y-auto'>
          {/* Analyzing State */}
          {analyzing && (
            <div className='flex flex-col items-center gap-4 text-gray-600 h-full justify-center'>
              <div className='relative'>
                <Sparkles className='w-16 h-16 animate-pulse text-[#009BB3]' />
                <div className='absolute inset-0 rounded-full border-2 border-[#009BB3] animate-ping opacity-20'></div>
              </div>
              <p className='text-lg font-medium'>Analyzing your resume...</p>
              <p className='text-sm text-gray-500'>This may take a few moments</p>
            </div>
          )}

          {/* Error state */}
          {!analyzing && error && (
            <div className='w-full p-4 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-center gap-2 mb-2'>
                <AlertCircle className='w-5 h-5 text-red-600' />
                <span className='font-semibold text-red-800'>Error</span>
              </div>
              <p className='text-sm text-red-600 whitespace-pre-wrap'>{error}</p>
            </div>
          )}

          {/* Content state */}
          {!analyzing && !error && analysisResult && (
            <div className='space-y-4'>
              {activeTab === 'strengths' && analysisResult.strengths && (
                <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                  <h3 className='text-lg font-semibold text-green-800 mb-3 flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5' />
                    Strengths
                  </h3>
                  <div className='text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none'>
                    <ReactMarkdown>{analysisResult.strengths}</ReactMarkdown>
                  </div>
                </div>
              )}
              
              {activeTab === 'improvements' && analysisResult.improvements && (
                <div className='p-4 bg-orange-50 rounded-lg border border-orange-200'>
                  <h3 className='text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2'>
                    <AlertCircle className='w-5 h-5' />
                    Areas for Improvement
                  </h3>
                  <div className='text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none'>
                    <ReactMarkdown>{analysisResult.improvements}</ReactMarkdown>
                  </div>
                </div>
              )}
              
              {activeTab === 'keywords' && analysisResult.keywords && (
                <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <h3 className='text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2'>
                    <Target className='w-5 h-5' />
                    Keyword Suggestions
                  </h3>
                  <div className='text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none'>
                    <ReactMarkdown>{analysisResult.keywords}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Download Button */}
              {analysisResult && (analysisResult.strengths || analysisResult.improvements || analysisResult.keywords) && (
                <button
                  onClick={downloadAsPDF}
                  className='flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md'
                >
                  <Download className='w-4 h-4' />
                  Download as PDF
                </button>
              )}
            </div>
          )}

          {/* Placeholder state */}
          {!analyzing && !error && !analysisResult.strengths && !analysisResult.improvements && !analysisResult.keywords && (
            <div className='text-sm flex flex-col items-center gap-6 text-gray-400 h-full justify-center'>
              <div className='w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center'>
                <FileText className='w-10 h-10' />
              </div>
              <div className='text-center'>
                <p className='text-lg font-medium text-gray-600 mb-2'>Ready to analyze your resume</p>
                <p>Upload a PDF resume and click "Analyze Resume" to get started</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default ReviewResume
