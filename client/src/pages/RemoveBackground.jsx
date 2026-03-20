import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Download, Eraser, Loader2, Sparkles } from 'lucide-react'

const RemoveBackground = () => {
  const { getToken } = useAuth()

  const [input, setInput] = useState(null) // File object
  const [originalPreview, setOriginalPreview] = useState('')

  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('') // processed image secure_url
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview)
    }
  }, [originalPreview])

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const maxWidth = 800
        const maxHeight = 800
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]

    setError('')
    setContent('')

    if (!file) {
      if (originalPreview) URL.revokeObjectURL(originalPreview)
      setInput(null)
      setOriginalPreview('')
      return
    }

    if (originalPreview) URL.revokeObjectURL(originalPreview)
    setInput(file)
    setOriginalPreview(URL.createObjectURL(file))
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!input) {
      setError('Please upload an image before submitting.')
      return
    }

    setLoading(true)
    setError('')
    setContent('')

    try {
      const token = await getToken()

      const compressedBase64 = await compressImage(input)
      const base64Data = compressedBase64.split(',')[1]

      const response = await fetch('http://localhost:3000/api/ai/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64: base64Data }),
      })

      const data = await response.json()

      if (data.success) {
        setContent(data.content)
      } else {
        setError(data.message || 'Failed to remove the background.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!content) return

    // Try to download the processed image as a file.
    try {
      const res = await fetch(content)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'remove-background.png'
      document.body.appendChild(a)
      a.click()
      a.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      // Fallback: open the image in a new tab.
      window.open(content, '_blank')
    }
  }

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* left col */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Background Remover</h1>
        </div>
        <p className="mt-6 text-sm font-medium">Upload image</p>

        <input
          onChange={handleFileChange}
          type="file"
          accept="image/*"
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600"
          required
        />
        <p className="text-xs text-gray-500 font-light mt-1">
          Supported formats: JPG, PNG, and many other image formats.
        </p>

        {originalPreview && (
          <div className="mt-6">
            <p className="text-xs text-gray-500 font-medium mb-2">Original Preview</p>
            <img
              src={originalPreview}
              alt="Original preview"
              className="w-full rounded border border-gray-200 max-h-64 object-contain"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !input}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Eraser className="w-5" />
              Remove background
            </>
          )}
        </button>
      </form>

      {/* Right col */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
        <div className="flex items-center gap-3">
          <Eraser className="w-5 h-5 text-[#FF4938]" />
          <h1 className="text-xl font-semibold">Processed Image</h1>
        </div>

        <div className="flex-1 flex justify-center items-center overflow-y-auto mt-4">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="w-9 h-9 animate-spin text-[#FF4938]" />
              <p className="text-sm">Removing background...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
            </div>
          )}

          {/* Content state */}
          {!loading && !error && content && (
            <div className="w-full flex flex-col items-center gap-4">
              <img
                src={content}
                alt="Processed preview"
                className="w-full rounded border border-gray-200 max-h-64 object-contain"
              />

              <button
                type="button"
                onClick={handleDownload}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#FF4938] to-[#F6AB41] text-white px-4 py-2 text-sm rounded-lg cursor-pointer"
              >
                <Download className="w-5" />
                Download
              </button>
            </div>
          )}

          {/* Placeholder state */}
          {!loading && !error && !content && (
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Eraser className="w-9 h-9" />
              <p>Upload an image and click "Remove background" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RemoveBackground
