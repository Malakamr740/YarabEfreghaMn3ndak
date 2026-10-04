import React, { useState, useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Menu, X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { recordNavigation, navigateBack } from '../lib/navigationHistory'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
  showBackButton?: boolean
  backButtonPath?: string
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
  showBackButton,
  backButtonPath,
}: AdminLayoutProps) {
  const { profile, session, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('math_diag_sidebar_collapsed') === 'true'
  })

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('math_diag_sidebar_collapsed', String(next))
      return next
    })
  }

  // Continuously record route transitions for reliable backward navigation
  useEffect(() => {
    recordNavigation(location.pathname)
  }, [location.pathname])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Assessments', path: '/admin/assessments', icon: '📝' },
    { label: 'Question Bank', path: '/admin/questions', icon: '🗂️' },
    { label: 'Taxonomy', path: '/admin/taxonomy', icon: '🏷️' },
    { label: 'Levels & Courses', path: '/admin/levels', icon: '🎯' },
    { label: 'Survey & Action Plans', path: '/admin/survey-action-plans', icon: '✨' },
    { label: 'Report & Rubric Builder', path: '/admin/report-settings', icon: '📋' },
    { label: 'Settings & Fields', path: '/admin/settings', icon: '⚙️' },
  ]

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  const shouldShowBack = showBackButton !== undefined ? showBackButton : true

  const handleBack = () => {
    navigateBack(navigate, location.pathname, backButtonPath)
  }

  const userDisplayName =
    profile?.full_name || session?.user?.email?.split('@')[0] || 'malakamr7400'

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900 font-sans relative overflow-x-hidden">
      {/* 1. Permanent Desktop Sidebar with Responsive Collapse */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-200 min-h-screen sticky top-0 h-screen shrink-0 select-none z-30 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Brand Header */}
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-100`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              A
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 text-sm leading-tight tracking-tight truncate">
                  Assessment Studio
                </h1>
                <p className="text-xs text-slate-500 font-normal truncate">Diagnostic &amp; Testing</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-2.5 py-3 space-y-1 flex-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-sm transition ${
                  sidebarCollapsed
                    ? 'justify-center py-2.5 px-0'
                    : 'gap-3 px-3 py-2.5'
                } ${
                  active
                    ? 'bg-blue-50/80 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom User Account & Sign Out */}
        <div className={`p-3 border-t border-slate-100 flex items-center ${sidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between gap-2'}`}>
          {!sidebarCollapsed ? (
            <>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{userDisplayName}</p>
                <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  {profile?.role || 'ADMIN'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0 cursor-pointer"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signOut()}
              title={`Sign out (${userDisplayName})`}
              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* 2. Mobile Header Bar & Drawer Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 px-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {shouldShowBack && (
            <button
              type="button"
              onClick={handleBack}
              title="Go to previous page"
              className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-blue-600 transition shadow-2xs shrink-0 cursor-pointer"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            A
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 text-xs leading-tight truncate">
              {title || 'Assessment Studio'}
            </h1>
            <p className="text-[10px] text-slate-500 truncate">{subtitle || 'Diagnostic & Testing'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg shrink-0 cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex animate-in fade-in duration-150"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col p-4 space-y-4 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  A
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 truncate">Assessment Studio</h2>
                  <p className="text-xs text-slate-500 truncate">Diagnostic &amp; Testing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg shrink-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{userDisplayName}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                  {profile?.role || 'ADMIN'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition shrink-0 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-14 transition-all duration-200 overflow-x-hidden">
        {/* Top Header Bar for subpages that specify title or actions */}
        {(title || actions || shouldShowBack) && (
          <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              {shouldShowBack && (
                <button
                  type="button"
                  onClick={handleBack}
                  title="Go to previous page"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-blue-600 transition shadow-2xs shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Back</span>
                </button>
              )}

              <div className="min-w-0 flex-1">
                {title && <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate leading-tight">{title}</h1>}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate leading-tight">{subtitle}</p>}
              </div>
            </div>

            {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
          </header>
        )}

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full min-w-0 mx-auto">{children}</main>
      </div>
    </div>
  )
}

