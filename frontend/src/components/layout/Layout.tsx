import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CreditCard, Settings, LogOut, Phone, Calendar as CalendarIcon, Users, HelpCircle, Search, Bell, Mail, Smartphone, Bot, ChevronDown, Plus, Edit } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState, useEffect } from 'react';
import { agentAPI } from '../../services/api';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [hasAgent, setHasAgent] = useState<boolean>(false);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);

  // Check if user has an agent
  useEffect(() => {
    const checkAgent = async () => {
      try {
        const response = await agentAPI.getAgent();
        setHasAgent(!!response.data?.agent_id);
      } catch (err) {
        setHasAgent(false);
      }
    };
    checkAgent();
  }, []);

  const mainNavigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Calls', to: '/calls', icon: Phone, badge: '12' },
    { name: 'Calendar', to: '/calendar', icon: CalendarIcon },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Team', to: '/team', icon: Users },
  ];

  const generalNavigation = [
    { name: 'Settings', to: '/settings', icon: Settings },
    { name: 'Billing', to: '/billing', icon: CreditCard },
    { name: 'Help', to: '/help', icon: HelpCircle },
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.company_name) {
      return user.company_name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'VA';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-white flex flex-col shadow-xl" style={{
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '4px 0 24px -2px rgba(15, 23, 42, 0.04)'
      }}>
        {/* Logo Section */}
        <div className="p-8 flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg" style={{
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
          }}>
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Vami</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 py-4 overflow-y-auto scrollbar-thin">
          {/* MENU Section */}
          <div className="mb-8">
            <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Menu
            </p>
            <div className="space-y-1.5">
              {mainNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-50 to-primary-50/50 text-primary-700 font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                      <span className="flex-1 text-sm font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Agent Menu with Submenu */}
              <div>
                <button
                  onClick={() => setAgentMenuOpen(!agentMenuOpen)}
                  className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 group"
                >
                  <Bot className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                  <span className="flex-1 text-sm font-medium text-left">Agent</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${agentMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Submenu */}
                {agentMenuOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {hasAgent ? (
                      <NavLink
                        to="/onboarding"
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        <Edit className="w-4 h-4" />
                        <span>Update Agent</span>
                      </NavLink>
                    ) : (
                      <NavLink
                        to="/onboarding"
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                            isActive
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Agent</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GENERAL Section */}
          <div>
            <p className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              General
            </p>
            <div className="space-y-1.5">
              {generalNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-50 to-primary-50/50 text-primary-700 font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                      <span className="text-sm font-medium">{item.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
              <button
                onClick={logout}
                className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group mt-2"
              >
                <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Promotional Card */}
        <div className="m-5 p-7 bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 rounded-2xl text-white shadow-xl" style={{
          boxShadow: '0 8px 24px -4px rgba(5, 150, 105, 0.3)'
        }}>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold mb-2">Download Mobile App</h3>
          <p className="text-xs opacity-95 leading-relaxed mb-5">
            Manage your AI agent on the go with our mobile app.
          </p>
          <button className="w-full py-3 px-4 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-primary-50 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-xl">
            Get Started
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="ml-[280px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl px-8 flex items-center gap-6 sticky top-0 z-40" style={{
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.03)'
        }}>
          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-400 font-medium"
              style={{
                boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)'
              }}
            />
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2.5">
            <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 relative group hover:shadow-sm">
              <Mail className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </button>
            <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200 relative group hover:shadow-sm">
              <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3.5 pl-6 ml-2 border-l border-slate-200">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md" style={{
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
            }}>
              {getUserInitials()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-900">
                {user?.company_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
