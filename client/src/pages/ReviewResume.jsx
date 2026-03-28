import { FileText, Sparkles, Loader2, Download, TrendingUp, AlertCircle, Target } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const ReviewResume = () => {
  const { getToken } = useAuth()
  const [pdfText, setPdfText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [processingFile, setProcessingFile] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [activeTab, setActiveTab] = useState('strengths')

  const getErrorMessage = (error) => {
    const msg = error.toString().toLowerCase()
    if (msg.includes('429')) return 'Service is temporarily busy. Please try again in a few seconds.'
    if (msg.includes('403')) return 'API configuration error. Please contact support.'
    if (msg.includes('401')) return 'Authentication error. Please sign in again.'
    if (msg.includes('500')) return 'Server error. Please try again later.'
    if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Please check your connection.'
    return 'Something went wrong. Please try again.'
  }

  const handleFileUpload = async (file) => {
    if (!file) return
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
        extractedText += textContent.items.map(item => item.str).join(' ') + '\n\n'
      }
      let cleanedText = extractedText
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
      setPdfText(`File name: ${file.name}\n\n${cleanedText}`)
    } catch (err) {
      if (err.name === 'PasswordException') setError('This PDF is password protected.')
      else if (err.name === 'InvalidPDFException') setError('Invalid PDF file.')
      else setError('Failed to process PDF. Please try again.')
    } finally {
      setProcessingFile(false)
    }
  }

  const analyzeResume = async () => {
    if (!pdfText) return
    setAnalyzing(true)
    setError('')
    setAnalysisResult(null)
    try {
      const token = await getToken()
      const response = await fetch('http://localhost:3000/api/ai/review-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText: pdfText, jobDescription })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        const c = data.content
        setAnalysisResult({
          strengths: c.strengths || '',
          areasForImprovement: c.areasForImprovement || '',
          keywordSuggestions: c.keywordSuggestions || '',
          atsScore: c.atsScore ?? null,
          atsBreakdown: c.atsBreakdown || '',
          rewriteSuggestions: c.rewriteSuggestions || '',
          jobMatchScore: c.jobMatchScore ?? null,
          jobMatchAnalysis: c.jobMatchAnalysis || ''
        })
        setActiveTab('strengths')
      } else {
        setError(getErrorMessage(data.message || ''))
      }
    } catch (err) {
      setError(getErrorMessage(err.message || ''))
    } finally {
      setAnalyzing(false)
    }
  }

  const getScoreStyle = (score) => {
    if (score >= 71) return { bg: 'from-green-500 to-green-600', text: 'text-green-600', label: 'Excellent' }
    if (score >= 41) return { bg: 'from-yellow-500 to-orange-500', text: 'text-orange-600', label: 'Average' }
    return { bg: 'from-red-500 to-red-600', text: 'text-red-600', label: 'Needs Work' }
  }

  const downloadAsPDF = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><head><title>Resume Analysis</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;} h1{color:#00DA83;} h3{color:#333;} </style>
      </head><body>
      <h1>Resume Analysis Report</h1>
      ${analysisResult?.atsScore != null ? `<h2>ATS Score: ${analysisResult.atsScore}/100</h2>` : ''}
      ${analysisResult?.strengths ? `<h3>Strengths</h3><p>${analysisResult.strengths}</p>` : ''}
      ${analysisResult?.areasForImprovement ? `<h3>Areas for Improvement</h3><p>${analysisResult.areasForImprovement}</p>` : ''}
      ${analysisResult?.keywordSuggestions ? `<h3>Keyword Suggestions</h3><p>${analysisResult.keywordSuggestions}</p>` : ''}
      ${analysisResult?.rewriteSuggestions ? `<h3>Rewrite Suggestions</h3><p>${analysisResult.rewriteSuggestions}</p>` : ''}
      ${analysisResult?.jobMatchAnalysis ? `<h3>Job Match Analysis</h3><p>${analysisResult.jobMatchAnalysis}</p>` : ''}
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const tabs = [
    { id: 'strengths', label: '💪 Strengths' },
    { id: 'areasForImprovement', label: '⚠️ Areas to Improve' },
    { id: 'keywordSuggestions', label: '🔑 Keywords' },
    { id: 'rewriteSuggestions', label: '✏️ Rewrites' },
    { id: 'atsBreakdown', label: '🤖 ATS Breakdown' },
    ...(analysisResult?.jobMatchScore != null ? [{ id: 'jobMatch', label: '🎯 Job Match' }] : [])
  ]

  const tabContent = {
    strengths: analysisResult?.strengths,
    areasForImprovement: analysisResult?.areasForImprovement,
    keywordSuggestions: analysisResult?.keywordSuggestions,
    rewriteSuggestions: analysisResult?.rewriteSuggestions,
    atsBreakdown: analysisResult?.atsBreakdown,
    jobMatch: analysisResult?.jobMatchAnalysis
  }

  return (
    <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700'>

      {/* Left Panel */}
      <div className='w-full max-w-lg p-4 rounded-xl' style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div className='flex items-center gap-3'>
          <Sparkles className='w-6 text-[#00DA83]' />
          <h1 className='text-xl font-semibold'>Resume Review</h1>
        </div>

        <p className='mt-6 text-sm font-medium text-slate-300'>Upload Resume</p>
        <input
          onChange={(e) => handleFileUpload(e.target.files[0] || null)}
          type='file'
          accept='application/pdf'
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-lg text-slate-200 placeholder-slate-500'
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        />
        {processingFile && (
          <div className='flex items-center gap-2 mt-2 text-sm text-gray-600'>
            <Loader2 className='w-4 h-4 animate-spin text-[#00DA83]' />
            <span>Processing PDF...</span>
          </div>
        )}
        <p className='text-xs text-slate-500 font-light mt-1'>Supports PDF resume only.</p>

        <p className='mt-4 text-sm font-medium text-slate-300'>
          Job Description <span className='text-slate-400 font-normal'>(Optional)</span>
        </p>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-lg text-slate-200 placeholder-slate-500'
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          rows={4}
          placeholder='Paste job description here for a Job Match score...'
        />

        {pdfText && !processingFile && (
          <button
            onClick={analyzeResume}
            disabled={analyzing}
            className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#009BB3] to-[#00DA83] text-white px-4 py-3 mt-4 text-sm rounded-xl cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50'
          >
            <Sparkles className='w-5' />
            {analyzing ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        )}

        {error && (
          <div className='mt-4 p-3 rounded-lg' style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)'
          }}>
            <div className='flex items-center gap-2'>
              <AlertCircle className='w-4 h-4 text-red-600' />
              <p className='text-sm text-red-600'>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className='w-full max-w-2xl p-6 rounded-xl flex flex-col' style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>

        {/* Empty state */}
        {!analyzing && !analysisResult && !error && (
          <div className='flex flex-col items-center gap-4 text-gray-400 h-full justify-center'>
            <FileText className='w-16 h-16' />
            <p className='text-lg font-medium'>Your analysis will appear here</p>
            <p className='text-sm'>Upload your resume and click Analyze</p>
          </div>
        )}

        {/* Loading state */}
        {analyzing && (
          <div className='flex flex-col items-center gap-4 text-gray-600 h-full justify-center'>
            <Sparkles className='w-16 h-16 animate-pulse text-[#009BB3]' />
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
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        {/* Results */}
        {!analyzing && analysisResult && (
          <div className='space-y-4'>

            {/* ATS Score Circle */}
            {analysisResult.atsScore != null && (
              <div className='text-center p-4 bg-gray-50 rounded-xl'>
                <p className='text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium'>ATS Score</p>
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreStyle(analysisResult.atsScore).bg} flex items-center justify-center mx-auto shadow-lg mb-2`}>
                  <span className='text-white text-2xl font-bold'>{analysisResult.atsScore}</span>
                </div>
                <p className={`font-semibold text-sm ${getScoreStyle(analysisResult.atsScore).text}`}>
                  {getScoreStyle(analysisResult.atsScore).label}
                </p>
              </div>
            )}

            {/* Job Match Score Circle */}
            {analysisResult.jobMatchScore != null && (
              <div className='text-center p-3 bg-blue-50 rounded-xl'>
                <p className='text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium'>Job Match Score</p>
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getScoreStyle(analysisResult.jobMatchScore).bg} flex items-center justify-center mx-auto shadow mb-1`}>
                  <span className='text-white text-lg font-bold'>{analysisResult.jobMatchScore}</span>
                </div>
                <p className={`font-semibold text-sm ${getScoreStyle(analysisResult.jobMatchScore).text}`}>
                  {getScoreStyle(analysisResult.jobMatchScore).label}
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className='flex flex-wrap gap-2'>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#00DA83] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className='bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed min-h-32'>
              {tabContent[activeTab]
                ? <ReactMarkdown>{tabContent[activeTab]}</ReactMarkdown>
                : <p className='text-gray-400'>No content available for this section.</p>
              }
            </div>

            {/* Download Button */}
            <button
              onClick={downloadAsPDF}
              className='flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md w-full justify-center'
            >
              <Download className='w-4 h-4' />
              Download as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewResume