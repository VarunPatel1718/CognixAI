import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X, Sun, Moon } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser } from '@clerk/clerk-react'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [isDark])

  const { isLoaded, isSignedIn } = useUser()

  // Wait until Clerk loads
  if (!isLoaded) {
    return null
  }

  // Not signed in → show SignIn
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <SignIn />
      </div>
    )
  }

  // Signed in → show app
  return (
    <div className="flex flex-col min-h-screen">

      <nav 
        className="w-full px-8 h-16 flex items-center justify-between border-b border-gray-200" 
        style={{
          background: isDark 
            ? 'rgba(8, 11, 20, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: isDark 
            ? '1px solid rgba(255,255,255,0.06)' 
            : '1px solid rgba(99,55,255,0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        <div className="flex items-center gap-4">
          <img 
            className='cursor-pointer w-32 sm:w-44'
            src={assets.logo}
            alt=""
            onClick={() => navigate('/')}
          />
          <button
            onClick={() => setIsDark(!isDark)}
            className='p-2 rounded-lg transition-all'
            style={{
              background: isDark 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(99,55,255,0.05)',
              border: isDark 
                ? '1px solid rgba(255,255,255,0.1)' 
                : '1px solid rgba(99,55,255,0.2)'
            }}
          >
            {isDark 
              ? <Sun className='w-4 h-4 text-yellow-400' />
              : <Moon className='w-4 h-4 text-slate-400' />
            }
          </button>
        </div>
        {
          sidebar
            ? <X 
                onClick={() => setSidebar(false)} 
                className='w-6 h-6 sm:hidden' 
                style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
              />
            : <Menu 
                onClick={() => setSidebar(true)} 
                className='w-6 h-6 sm:hidden' 
                style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
              />
        }
      </nav>

      <div className="flex-1 w-full flex">
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
        <div className="flex-1 bg-[#F4F7FB]">
          <Outlet />
        </div>
      </div>

    </div>
  )
}

export default Layout
