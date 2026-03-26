import React from 'react'
import { assets } from '../assets/assets'

const Hero = ({ showDemo, setShowDemo, navigate }) => {
    return (
        <div className='px-4 sm:px-20 xl:px-32 relative inline-flex flex-col w-full justify-center bg-[url(/gradientBackground.png)] bg-cover bg-no-repeat min-h-screen'>
            <div className='text-center mb-6'>
                <h1 className='text-3xl sm:text-5xl md:text-6xl 2xl:text-7xl font-semibold mx-auto leading-[1.2] text-center'>Create amazing content<br /> with <span className='text-primary'>AI tools</span></h1>
                <p className='mt-4 max-w-2xl mx-auto text-center text-sm sm:text-base text-gray-500 leading-relaxed'>Transform your content creation with our suite of premium AI tools.
                    Write articles, generate images, and enhance your workflow.</p>
            </div>
            <div className='mt-8 flex flex-wrap justify-center gap-4 text-sm max-sm:text-xs'>
                <button onClick={() => navigate('/ai')} className='bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-8 py-3 rounded-full font-medium cursor-pointer transition-all shadow-lg hover:shadow-violet-300 hover:scale-105'>Start creating now</button>
                <button onClick={() => setShowDemo(true)} className='bg-white px-10 py-3 rounded-lg border border-gray-300 hover:scale-102 active:scale-95 transition cursor-pointer'>Watch demo </button>
            </div>
            <div className='flex items-center gap-4 mt-8 mx-auto text-gray-600'>
                <img src={assets.user_group} alt="" className='h-8' />
                Trusted by 10k+ users worldwide
            </div>

        </div>
    )
}

export default Hero
