import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { Code2, Copy, Download, Loader2, Code } from 'lucide-react'

const GenerateCode = () => {
  const { getToken } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript')
  const [codeType, setCodeType] = useState('full')
  const [generatedCode, setGeneratedCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const languages = [
    'JavaScript', 'Python', 'React', 'Node.js', 
    'SQL', 'TypeScript', 'HTML/CSS', 'Java', 'C++'
  ]

  const getFileExtension = (lang) => {
    const extensions = {
      'JavaScript': 'js',
      'Python': 'py', 
      'React': 'jsx',
      'Node.js': 'js',
      'SQL': 'sql',
      'TypeScript': 'ts',
      'HTML/CSS': 'html',
      'Java': 'java',
      'C++': 'cpp'
    }
    return extensions[lang] || 'txt'
  }

  const handleGenerateCode = async () => {
    if (!prompt.trim()) {
      setError('Please describe what code you want to generate')
      return
    }

    setLoading(true)
    setError('')
    setGeneratedCode('')

    try {
      const token = await getToken()
      
      const response = await axios.post(
        'http://localhost:3000/api/ai/generate-code',
        {
          prompt: prompt.trim(),
          language: selectedLanguage,
          codeType: codeType
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        setGeneratedCode(response.data.content)
      } else {
        setError(response.data.message || 'Failed to generate code')
      }
    } catch (err) {
      setError('Failed to generate code: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  const downloadCode = () => {
    const extension = getFileExtension(selectedLanguage)
    const filename = `code.${extension}`
    
    const blob = new Blob([generatedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AI Code Generator</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Code Requirements</h2>
            
            {/* Language Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programming Language
              </label>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedLanguage === lang
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Type Toggle */}
            <div className='mt-4'>
              <p className='text-sm font-medium mb-2'>Code Type</p>
              <div className='flex gap-3'>
                <span 
                  onClick={() => setCodeType('full')}
                  className={`text-xs px-4 py-2 border rounded-full 
                  cursor-pointer ${codeType === 'full' 
                    ? 'bg-orange-50 text-orange-700 border-orange-300' 
                    : 'text-gray-500 border-gray-300'}`}>
                  📦 Full Program
                </span>
                <span 
                  onClick={() => setCodeType('logic')}
                  className={`text-xs px-4 py-2 border rounded-full 
                  cursor-pointer ${codeType === 'logic' 
                    ? 'bg-orange-50 text-orange-700 border-orange-300' 
                    : 'text-gray-500 border-gray-300'}`}>
                  🧩 Logic Only
                </span>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="mb-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what code you want to generate
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Create a REST API with Express.js that handles user authentication..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                disabled={loading}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateCode}
              disabled={loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Code...
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4" />
                  Generate Code
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">❌ {error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Generated Code */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Generated Code</h2>
              {generatedCode && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                    {selectedLanguage}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {codeType === 'full' ? '📦 Full' : '🧩 Logic'}
                  </span>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Generating code...</p>
                <p className="text-gray-500 text-sm mt-1">This may take a few seconds</p>
              </div>
            ) : generatedCode ? (
              <div className="space-y-4">
                {/* Code Display */}
                <div className="relative">
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadCode}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      title="Download as file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
                    <code>{generatedCode}</code>
                  </pre>
                </div>

                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✅ <strong>Code generated successfully!</strong> Copy or download your code above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Code className="w-12 h-12 mb-4" />
                <p className="text-gray-600 font-medium">No code generated yet</p>
                <p className="text-gray-500 text-sm mt-1">Describe what code you want to generate and select a language</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerateCode
