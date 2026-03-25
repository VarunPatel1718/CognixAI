import { useUser } from '@clerk/clerk-react'
import React, { useEffect, useState } from 'react'
import { Heart, Download } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

const Community = () => {

  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useUser()
  const { getToken } = useAuth()

  const fetchPublishedCreations = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('http://localhost:3000/api/ai/get-published-creations')
      const data = await response.json()
      
      if (data.success) {
        // Filter only image type creations
        const imageCreations = data.data.filter(creation => creation.type === 'image')
        setCreations(imageCreations)
      } else {
        setError(data.message || 'Failed to fetch creations')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load community creations')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = async (imageUrl, prompt) => {
    try {
      // Fetch image as a blob to handle cross-origin Cloudinary URLs
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = url
      
      // Use prompt as filename (cleaned)
      const filename = prompt ? 
        prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50) + '.png' 
        : 'community-image.png'
      link.download = filename
      
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
      link.href = imageUrl
      link.download = 'community-image.png'
      link.target = '_blank'
      link.click()
    }
  }

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
        // Update the specific creation in state
        setCreations(prev => prev.map(creation => 
          creation.id === creationId 
            ? { ...creation, likes: data.likes }
            : creation
        ))
      } else {
        console.error('Server error:', data.message)
        setError(data.message || 'Failed to toggle like')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Failed to toggle like')
    }
  }

  useEffect(() => {
    if (user) {
      fetchPublishedCreations()
    }
  }, [user])

  return (
    <div className='flex-1 h-full flex flex-col gap-4 p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold'>Community Creations</h2>
        {error && (
          <div className='text-sm text-red-600 bg-red-50 px-3 py-1 rounded'>
            {error}
          </div>
        )}
      </div>
      
      <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>
        {loading ? (
          <div className='flex items-center justify-center h-32'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : creations.length === 0 ? (
          <div className='flex items-center justify-center h-32 text-gray-500'>
            No published creations yet. Be the first to share!
          </div>
        ) : (
          creations.map((creation, index) => (
            <div
              key={index}
              className='relative group inline-block pl-3 pt-3 w-full
        sm:max-w-1/2 lg:max-w-1/3'
            >
              <img
                src={creation.content}
                alt=''
                className='w-full h-full object-cover rounded-lg'
              />

              <div
                className='absolute bottom-0 top-0 right-0 left-3 flex gap-2
  items-end justify-end group-hover:justify-between p-3
  group-hover:bg-gradient-to-b from-transparent to-black/80
  text-white rounded-lg'
            >
                <p className='text-sm hidden group-hover:block'>
                  {creation.prompt}
                </p>

                <div className='flex gap-1 items-center'>
                  <p>{creation.likes?.length || 0}</p>
                  <Heart
                    onClick={() => toggleLike(creation.id)}
                    className={`min-w-5 h-5 hover:scale-110 cursor-pointer ${creation.likes?.includes(user?.id)
                      ? 'fill-red-500 text-red-600'
                      : 'text-white'
                      }`}
                  />
                  <Download
                    onClick={() => downloadImage(creation.content, creation.prompt)}
                    className='min-w-5 h-5 hover:scale-110 cursor-pointer text-white ml-2'
                  />
                </div>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  )
}

export default Community
