import React from 'react'
import { Sparkles } from 'lucide-react'

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-[#0b0e14]">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Wavy dark background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1525] to-[#1a1f35]" />
        
        {/* SVG Wave layers */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 900" preserveAspectRatio="none">
          <path d="M0,0 L600,0 L600,900 L0,900 Z" fill="#0f1525" />
          <path d="M450,0 Q500,150 480,300 Q460,450 500,600 Q540,750 470,900 L600,900 L600,0 Z" fill="#151b30" opacity="0.7" />
          <path d="M400,0 Q450,200 420,400 Q390,550 440,700 Q480,850 430,900 L600,900 L600,0 Z" fill="#1a2240" opacity="0.5" />
          <path d="M350,0 Q420,180 380,360 Q340,500 400,650 Q440,800 380,900 L600,900 L600,0 Z" fill="#1e2850" opacity="0.3" />
          <path d="M320,0 Q380,220 350,440 Q320,580 370,720 Q410,840 340,900 L600,900 L600,0 Z" fill="#222e5a" opacity="0.2" />
        </svg>

        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Welcome Text */}
          <div>
            <h2 className="text-4xl font-bold text-white/90 leading-tight">
              Welcome<br />Back
            </h2>
          </div>
          
          {/* Center Branding */}
          <div className="flex items-center gap-4 -mt-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-4 ring-white/10">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">CMP AI</h1>
              <p className="text-slate-400 text-sm">Contractor Management</p>
            </div>
          </div>
          
          {/* Bottom tagline */}
          <div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Manage contractors, invoices, timesheets and expenses — all in one AI-powered platform.
            </p>
            {/* Decorative dots */}
            <div className="flex gap-2 mt-4">
              <div className="w-8 h-1.5 rounded-full bg-indigo-500" />
              <div className="w-3 h-1.5 rounded-full bg-indigo-500/40" />
              <div className="w-3 h-1.5 rounded-full bg-indigo-500/20" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile-only brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CMP AI</h1>
            <p className="text-slate-500 text-sm">Contractor Management Platform</p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}
