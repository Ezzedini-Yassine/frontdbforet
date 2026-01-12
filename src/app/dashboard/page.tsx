/**
 * Symbiose Dashboard - Professional Demo Version
 * 
 * Features:
 * - Welcome header with animated tree logo
 * - User profile card
 * - Quick stats grid
 * - Recent activity section
 * - Action cards for key features
 */

'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header with Tree Logo */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-emerald-100">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              {/* Tree Logo */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl animate-pulse opacity-20"></div>
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* SVG Tree Icon */}
                  <svg 
                    className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-600" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 2L9 8h2v4H9l3 6 3-6h-2V8h2l-3-6z"/>
                    <path d="M10 18v4h4v-4h-4z"/>
                    <ellipse cx="12" cy="9" rx="7" ry="3" opacity="0.3"/>
                  </svg>
                </div>
              </div>
              
              {/* Welcome Text */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Symbiose</span>
                </h1>
                <p className="text-gray-600 text-lg">
                  Hello, <span className="font-semibold text-emerald-700">{user?.username || user?.email}</span>
                </p>
              </div>
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-3 rounded-xl border border-emerald-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                {(user?.username || user?.email)?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-gray-500">Logged in as</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Projects"
            value="12"
            change="+3 this week"
            changeType="positive"
            icon={<ProjectsIcon />}
            gradient="from-emerald-500 to-teal-600"
          />
          <StatCard
            title="Team Members"
            value="48"
            change="+5 this month"
            changeType="positive"
            icon={<UsersIcon />}
            gradient="from-teal-500 to-cyan-600"
          />
          <StatCard
            title="Tasks Completed"
            value="234"
            change="+18 today"
            changeType="positive"
            icon={<TasksIcon />}
            gradient="from-cyan-500 to-blue-600"
          />
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ActionCard
            title="Create New Project"
            description="Start a new collaborative project with your team"
            buttonText="Get Started"
            icon="🚀"
            gradient="from-emerald-500 to-teal-600"
          />
          <ActionCard
            title="View Analytics"
            description="Track your team's progress and performance metrics"
            buttonText="View Dashboard"
            icon="📊"
            gradient="from-teal-500 to-cyan-600"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            <ActivityItem
              user="Sarah Chen"
              action="completed the design review"
              project="Mobile App Redesign"
              time="2 hours ago"
              avatar="S"
            />
            <ActivityItem
              user="Marcus Johnson"
              action="uploaded new documentation"
              project="API Integration"
              time="4 hours ago"
              avatar="M"
            />
            <ActivityItem
              user="Elena Rodriguez"
              action="created a new milestone"
              project="Q1 Launch Plan"
              time="Yesterday"
              avatar="E"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickLink icon="📁" label="Projects" />
          <QuickLink icon="👥" label="Team" />
          <QuickLink icon="⚙️" label="Settings" />
          <QuickLink icon="💬" label="Messages" />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ title, value, change, changeType, icon, gradient }: {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span className={`text-sm font-medium ${changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

// Action Card Component
function ActionCard({ title, description, buttonText, icon, gradient }: {
  title: string
  description: string
  buttonText: string
  icon: string
  gradient: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>
          <button className={`px-6 py-2 rounded-lg text-white font-medium bg-gradient-to-r ${gradient} hover:shadow-lg transition-shadow duration-300`}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Activity Item Component
function ActivityItem({ user, action, project, time, avatar }: {
  user: string
  action: string
  project: string
  time: string
  avatar: string
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold">
        {avatar}
      </div>
      <div className="flex-1">
        <p className="text-gray-900">
          <span className="font-semibold">{user}</span> {action}
        </p>
        <p className="text-sm text-gray-500">{project}</p>
      </div>
      <span className="text-sm text-gray-400">{time}</span>
    </div>
  )
}

// Quick Link Component
function QuickLink({ icon, label }: { icon: string, label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

// Icon Components
function ProjectsIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}