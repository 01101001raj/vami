import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, CreditCard, Settings, LogOut, Phone, Calendar as CalendarIcon, Users, HelpCircle, Search, Bell, Mail, Smartphone } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();

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
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-[260px] bg-white border-r border-slate-200 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="text-xl font-bold text-slate-900">Vami</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          {/* MENU Section */}
          <div className="mb-6">
            <p className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Menu
            </p>
            <div className="space-y-1">
              {mainNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-semibold border-l-3 border-primary-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-sm">{item.name}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-primary-600 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* GENERAL Section */}
          <div>
            <p className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              General
            </p>
            <div className="space-y-1">
              {generalNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 font-semibold border-l-3 border-primary-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-primary-600'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </NavLink>
              ))}
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Promotional Card */}
        <div className="m-4 p-6 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl text-white">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold mb-2">Download our Mobile App</h3>
          <p className="text-xs opacity-90 leading-relaxed mb-4">
            Get easy access to your AI agent from anywhere.
          </p>
          <button className="w-full py-2.5 px-4 bg-white text-primary-600 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-all duration-200 hover:-translate-y-0.5">
            Download
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="ml-[260px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center gap-6">
          {/* Search Bar */}
          <div className="flex-1 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search task"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent focus:bg-white transition-all"
            />
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors relative">
              <Mail className="w-5 h-5 text-slate-600" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.company_name || 'User'}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
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
