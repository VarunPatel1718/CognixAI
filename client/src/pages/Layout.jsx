import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { SignIn, useUser } from '@clerk/clerk-react'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar, setSidebar] = useState(false)

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

      <nav className="w-full px-8 h-16 flex items-center justify-between border-b border-gray-200">
        <img className='cursor-pointer w-32 sm:w-44'
          src={assets.logo}
          alt=""
          onClick={() => navigate('/')}
        />
        {
          sidebar
            ? <X onClick={() => setSidebar(false)} className="w-6 h-6 text-gray-600 sm:hidden" />
            : <Menu onClick={() => setSidebar(true)} className="w-6 h-6 text-gray-600 sm:hidden" />
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
