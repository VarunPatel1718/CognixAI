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
          <div className='rounded-2xl p-6 max-w-lg w-full' style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)'
          }} onClick={e => e.stopPropagation()}>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-semibold text-slate-100'>
                CognixAI Features
              </h2>
              <button onClick={() => setShowDemo(false)} className='text-slate-400 hover:text-slate-200 text-2xl font-bold'>×</button>
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
                <div key={i} className='p-3 rounded-xl' style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div className='text-2xl mb-1'>{feature.icon}</div>
                  <p className='font-medium text-sm text-slate-100'>{feature.title}</p>
                  <p className='text-xs text-slate-400'>{feature.desc}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => { setShowDemo(false); navigate('/ai') }}
              className='w-full mt-4 text-white py-2 rounded-lg transition-colors'
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0d9488)' }}
            >
              Start Creating Now →
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Home
