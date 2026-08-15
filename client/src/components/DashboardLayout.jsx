import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Mail, BarChart3, MessageSquare, X } from 'lucide-react';
import { useState } from 'react';
import ChatPanel from './ChatPanel';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/recipients', label: 'Recipients', icon: Users },
  { to: '/programs', label: 'Programs', icon: Mail },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function DashboardLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40" style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E5'
      }}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-[56px]">
          {/* Left: Wordmark */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: '#2C4A7C' }}>
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-[15px] font-semibold" style={{ color: '#171717' }}>MedReach</span>
          </div>

          {/* Center: Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex items-center gap-2 px-4 py-[16px] text-[13px] font-medium transition-colors relative"
                  style={{
                    color: isActive ? '#2C4A7C' : '#737373',
                    borderBottom: isActive ? '2px solid #2C4A7C' : '2px solid transparent',
                    marginBottom: '-1px'
                  }}
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              );
            })}
          </div>

          {/* Right: Assistant */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium transition-all cursor-pointer"
            style={{
              backgroundColor: chatOpen ? '#2C4A7C' : 'transparent',
              color: chatOpen ? '#FFFFFF' : '#2C4A7C',
              border: `1px solid ${chatOpen ? '#2C4A7C' : '#E5E5E5'}`
            }}
          >
            {chatOpen ? <X size={15} /> : <MessageSquare size={15} />}
            Assistant
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-[56px]">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>

      {/* Chat Panel */}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}
