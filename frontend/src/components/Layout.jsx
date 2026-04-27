import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4" 
           style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white' }}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>NÜRDAM</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg cursor-pointer"
          style={{ color: 'var(--text-primary)', background: 'var(--bg-input)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main
        className="flex-1 w-full pt-20 md:pt-8 px-4 md:px-8 transition-all duration-300"
        style={{
          minHeight: '100vh',
        }}
      >
        <div className="max-w-6xl mx-auto animate-fade-in md:ml-[260px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
