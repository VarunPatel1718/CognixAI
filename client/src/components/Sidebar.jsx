import { Protect, useClerk, useUser } from "@clerk/clerk-react";
import {
  Code,
  Eraser,
  FileText,
  Hash,
  House,
  Image,
  MessageCircle,
  Scissors,
  SquarePen,
  Users,
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

const navItems = [
  { to: "/ai", label: "Dashboard", Icon: House },
  { to: "/ai/chat", label: "AI Chat", Icon: MessageCircle },
  { to: "/ai/write-article", label: "Write Article", Icon: SquarePen },
  { to: "/ai/blog-titles", label: "Blog Titles", Icon: Hash },
  { to: "/ai/generate-code", label: "Code Generator", Icon: Code },
  { to: "/ai/generate-images", label: "Generate Images", Icon: Image },
  { to: "/ai/remove-background", label: "Remove Background", Icon: Eraser },
  { to: "/ai/remove-object", label: "Remove Object", Icon: Scissors },
  { to: "/ai/review-resume", label: "Review Resume", Icon: FileText },
  { to: "/ai/community", label: "Community", Icon: Users },
];

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  return (
    <div
      className={`w-60 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}
      style={{
        background: 'rgba(8, 11, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(148, 163, 184, 0.08)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}
    >
      <div style={{
        height: '2px',
        background: 'linear-gradient(90deg, #6337ff, #06b6d4, #ec4899)',
        borderRadius: '0 0 4px 4px'
      }} />
      <div className="my-7 w-full">
        <img
          src={user?.imageUrl}
          alt="User Avatar"
          className="w-13 rounded-full mx-auto "
        />
        <h1 
          className='mt-2 text-center font-semibold tracking-tight'
          style={{ color: '#f1f5f9', fontSize: '0.95rem' }}
        >
          {user?.fullName}
        </h1>
        <div className="px-6 mt-5 text-sm text-gray-600 font-medium">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/ai'}
              onClick={() => setSidebar(false)}
            >
              {({ isActive }) => (
                <div
                  className={`px-3.5 py-2.5 flex items-center 
                  gap-3 rounded-lg transition-all duration-200 
                  cursor-pointer ${isActive 
                    ? 'text-violet-300' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(99,55,255,0.2), rgba(6,182,212,0.15))',
                    border: '1px solid rgba(99,55,255,0.3)',
                    boxShadow: '0 0 12px rgba(99,55,255,0.15)'
                  } : {}}
                >
                  <Icon className={`w-4 h-4 ${isActive 
                    ? 'text-violet-400' 
                    : 'text-slate-500'}`} 
                  />
                  <span className='text-sm font-medium'>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
      <div 
        className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between" 
        style={{ 
          borderTop: '1px solid rgba(148,163,184,0.08)', 
          background: 'rgba(99,55,255,0.05)'
        }}
      >
        <div
          onClick={openUserProfile}
          className="flex gap-2 items-center cursor-pointer"
        >
          <img src={user.imageUrl} className="w-7 rounded-full" alt="User" />
          <div>
            <h1 
              className="font-medium"
              style={{ fontSize: '0.78rem', color: '#e2e8f0' }}
            >
              {user?.fullName}
            </h1>
            <p 
              className="text-xs"
              style={{ fontSize: '0.7rem', color: '#a78bfa' }}
            >
              <Protect plan="premium" fallback="Free">Premium Plan</Protect>
            </p>
          </div>
        </div>

        <LogOut
          onClick={signOut}
          className='w-4.5 text-slate-500 hover:text-slate-300 transition cursor-pointer'
        />
      </div>
    </div>
  );
};

export default Sidebar;
