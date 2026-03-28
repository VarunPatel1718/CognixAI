import { useUser } from '@clerk/clerk-react'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Heart, Download, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

const Community = () => {

  const [allCreations, setAllCreations] = useState([])
  const [displayedCreations, setDisplayedCreations] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  
  const { user } = useUser()
  const { getToken } = useAuth()
  
  const imagesContainerRef = useRef(null)
  const loadingRef = useRef(false)

  const formatPrompt = (prompt) => {
    if (!prompt) return 'AI Generated Image'
    
    const styleKeywords = [
      'Realistic style', '3D style', 'Anime style', 
      'Ghibli style', 'Cartoon style', 'Fantasy style', 
      'Portrait style', 'Realistic'
    ]
    
    let cleanPrompt = prompt
    let foundStyle = ''
    
    styleKeywords.forEach(style => {
      if (prompt.includes(style)) {
        foundStyle = style
        cleanPrompt = cleanPrompt.replace(style, '').trim()
      }
    })
    
    cleanPrompt = cleanPrompt
      .replace(/[,\s]+$/, '')
      .trim()
    
    cleanPrompt = cleanPrompt.charAt(0).toUpperCase() + 
      cleanPrompt.slice(1)
    
    if (foundStyle) {
      return `${cleanPrompt} — ${foundStyle}` 
    }
    
    return cleanPrompt || 'AI Generated Image'
  }

  const downloadImage = async (url, prompt) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = prompt.slice(0, 20) + '.png'
      link.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  const fetchAllCreations = useCallback(async () => {
    if (loadingRef.current) return // Prevent duplicate requests
    
    try {
      setLoading(true)
      setError('')
      setAllCreations([])
      setDisplayedCreations([])
      
      loadingRef.current = true
      
      const response = await fetch(`http://localhost:3000/api/ai/get-published-creations`)
      const data = await response.json()
      
      if (data.success) {
        // Filter only image type creations
        const imageCreations = data.data.filter(creation => creation.type === 'image')
        setAllCreations(imageCreations)
        
        // Show first 12 images initially
        const initialCreations = imageCreations.slice(0, 12)
        setDisplayedCreations(initialCreations)
        
        // Check if there are more images to load
        setHasMore(imageCreations.length > 12)
      } else {
        setError(data.message || 'Failed to fetch creations')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load community creations')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  const loadMoreCreations = useCallback(() => {
    if (!hasMore || loadingMore) return
    
    setLoadingMore(true)
    
    // Get next 12 images from allCreations
    const currentLength = displayedCreations.length
    const nextCreations = allCreations.slice(currentLength, currentLength + 12)
    
    if (nextCreations.length > 0) {
      setDisplayedCreations(prev => [...prev, ...nextCreations])
      
      // Check if there are still more images
      const newLength = currentLength + nextCreations.length
      setHasMore(newLength < allCreations.length)
    } else {
      setHasMore(false)
    }
    
    setLoadingMore(false)
  }, [allCreations, displayedCreations, hasMore, loadingMore])

  const toggleLike = async (creationId) => {
    if (!user) return
    
    try {
      const token = await getToken()
      
      console.log('Toggling like for creation:', creationId)
      console.log('User ID:', user.id)
      console.log('Token exists:', !!token)
      
      const response = await fetch('http://localhost:3000/api/ai/toggle-like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ creationId, userId: user.id }) // Send userId as string
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (data.success) {
        // Update both allCreations and displayedCreations
        const updateCreations = (creations) => creations.map(creation => 
          creation.id === creationId 
            ? { ...creation, likes: data.likes }
            : creation
        )
        
        setAllCreations(updateCreations)
        setDisplayedCreations(updateCreations)
      } else {
        console.error('Server error:', data.message)
        setError(data.message || 'Failed to toggle like')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Failed to toggle like')
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore) return // Stop observing when no more images

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreCreations()
        }
      },
      {
        threshold: 1.0,
        rootMargin: '100px'
      }
    )

    const currentContainer = imagesContainerRef.current
    if (currentContainer) {
      // Find the loading indicator element
      const loadingElement = currentContainer.querySelector('[data-infinite-scroll-loading]')
      if (loadingElement) {
        observer.observe(loadingElement)
      }
    }

    return () => {
      if (currentContainer) {
        const loadingElement = currentContainer.querySelector('[data-infinite-scroll-loading]')
        if (loadingElement) {
          observer.unobserve(loadingElement)
        }
      }
    }
  }, [hasMore, loadingMore, loading, loadMoreCreations])

  useEffect(() => {
    if (user) {
      fetchAllCreations()
    }
  }, [user, fetchAllCreations])

  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold text-slate-200'>Community Creations</h2>
        {error && (
          <div className='text-sm text-red-600 bg-red-50 px-3 py-1 rounded'>
            {error}
          </div>
        )}
      </div>
      
      <div className='flex-1 overflow-y-auto' ref={imagesContainerRef}>
        {loading && displayedCreations.length === 0 ? (
          <div className='flex items-center justify-center h-32'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400'></div>
          </div>
        ) : displayedCreations.length === 0 ? (
          <div className='flex items-center justify-center h-32 text-slate-500'>
            No published creations yet. Be the first to share!
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-4'>
              {displayedCreations.map((creation, index) => (
                <div
                  key={index}
                  className='relative group w-full'
                >
                  <img
                    src={creation.content}
                    alt=''
                    className='w-full h-full object-cover rounded-lg'
                  />

                  {/* Hover overlay */}
                  <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <p className='text-sm text-white mb-3 line-clamp-2 min-h-[2.5rem]'>
                      {formatPrompt(creation.prompt)}
                    </p>
                    <div className='flex justify-between items-center'>
                      <button
                        onClick={() => downloadImage(creation.content, creation.prompt)}
                        className='flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-colors'
                      >
                        <Download className='w-4 h-4' />
                        <span className='text-sm'>Download</span>
                      </button>
                      
                      {/* Like button - always visible */}
                      <div className='flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg'>
                        <p className='text-white text-sm'>{creation.likes?.length || 0}</p>
                        <Heart
                          onClick={() => toggleLike(creation.id)}
                          className={`w-4 h-4 cursor-pointer transition-colors ${creation.likes?.includes(user?.id)
                            ? 'fill-red-500 text-red-400'
                            : 'text-white hover:text-red-300'
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Infinite scroll loading indicator */}
            {hasMore ? (
              <div 
                data-infinite-scroll-loading
                className='flex justify-center items-center py-4'
              >
                {loadingMore ? (
                  <div className='flex items-center gap-2 text-slate-400'>
                    <Loader2 className='w-5 h-5 animate-spin text-violet-400' />
                    <span className='text-sm'>Loading more creations...</span>
                  </div>
                ) : (
                  <p className='text-sm text-slate-400'>
                    Scroll for more
                  </p>
                )}
              </div>
            ) : (
              <div className='flex justify-center items-center py-4'>
                <p className='text-sm text-slate-500'>
                  You have seen all creations
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Community
