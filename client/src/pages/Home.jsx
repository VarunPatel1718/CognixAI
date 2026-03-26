import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import AiTools from '../components/AItools'
import Testimonial from '../components/Testimonial'
import Plan from '../components/Plan'
import Footer from '../components/Footer'

const Home = () => {
  const navigate = useNavigate()
  const [showDemo, setShowDemo] = useState(false)

  return (
    <>
      <Navbar />
      <Hero showDemo={showDemo} setShowDemo={setShowDemo} navigate={navigate} />
      <AiTools />
      <Testimonial />
      <Plan />
      <Footer />
      
      {/* Demo Modal */}
      {showDemo && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4' onClick={() => setShowDemo(false)}>
          <div className='bg-white rounded-2xl p-6 max-w-lg w-full' onClick={e => e.stopPropagation()}>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold'>
                CognixAI Features
              </h2>
              <button onClick={() => setShowDemo(false)} className='text-gray-400 hover:text-gray-600 text-2xl font-bold'>×</button>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              {[
                { icon: '✍️', title: 'Article Generator', desc: 'Generate full articles with AI' },
                { icon: '💡', title: 'Blog Titles', desc: 'Creative titles in seconds' },
                { icon: '🖼️', title: 'Image Generator', desc: 'AI powered image creation' },
                { icon: '🧼', title: 'Background Remover', desc: 'Remove backgrounds instantly' },
                { icon: '📄', title: 'Resume Analyzer', desc: 'Get ATS score and feedback' },
                { icon: '👥', title: 'Community', desc: 'Share AI creations publicly' },
              ].map((feature, i) => (
                <div key={i} className='p-3 bg-gray-50 rounded-xl'>
                  <div className='text-2xl mb-1'>{feature.icon}</div>
                  <p className='font-medium text-sm'>{feature.title}</p>
                  <p className='text-xs text-gray-500'>{feature.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => { setShowDemo(false); navigate('/ai') }}
              className='w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors'>
              Start Creating Now →
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Home
