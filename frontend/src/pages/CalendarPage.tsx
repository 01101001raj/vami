import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Settings, Users, Video, MapPin, ExternalLink } from 'lucide-react';

interface Appointment {
  id: number;
  title: string;
  date: string;
  time: string;
  duration: string;
  attendees: number;
  type: 'call' | 'meeting' | 'video';
  location?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

// Mock data - in production this would come from API
const mockAppointments: Appointment[] = [
  {
    id: 1,
    title: 'Client Consultation Call',
    date: '2025-11-08',
    time: '10:00 AM',
    duration: '30 min',
    attendees: 2,
    type: 'call',
    status: 'upcoming'
  },
  {
    id: 2,
    title: 'Team Sync Meeting',
    date: '2025-11-08',
    time: '2:00 PM',
    duration: '1 hour',
    attendees: 5,
    type: 'video',
    location: 'Zoom',
    status: 'upcoming'
  },
  {
    id: 3,
    title: 'Product Demo',
    date: '2025-11-09',
    time: '11:00 AM',
    duration: '45 min',
    attendees: 3,
    type: 'meeting',
    status: 'upcoming'
  }
];

export default function CalendarPage() {
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <CalendarIcon className="w-5 h-5 text-primary-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'meeting':
        return <Users className="w-5 h-5 text-purple-600" />;
      default:
        return <CalendarIcon className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-primary-100 text-primary-700';
      case 'video':
        return 'bg-blue-100 text-blue-700';
      case 'meeting':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-slate-900 mb-2">
            Calendar
          </h1>
          <p className="text-body text-slate-600">Manage appointments and sync your calendar</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Settings className="w-4 h-4" />
            Connect Calendar
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="metric-label">Total Appointments</p>
          <p className="metric-value">{appointments.length}</p>
          <p className="text-caption text-primary-600 font-medium mt-2">This month</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="metric-label">Upcoming</p>
          <p className="metric-value">
            {appointments.filter(a => a.status === 'upcoming').length}
          </p>
          <p className="text-caption text-blue-600 font-medium mt-2">Next 7 days</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="metric-label">Completed</p>
          <p className="metric-value">
            {appointments.filter(a => a.status === 'completed').length}
          </p>
          <p className="text-caption text-green-600 font-medium mt-2">This week</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="metric-label">Total Attendees</p>
          <p className="metric-value">
            {appointments.reduce((acc, a) => acc + a.attendees, 0)}
          </p>
          <p className="text-caption text-purple-600 font-medium mt-2">All meetings</p>
        </div>
      </div>

      {/* View Toggle and Calendar Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Integration Card */}
        <div className="card">
          <h2 className="text-h2 text-slate-900 mb-4">Calendar Integration</h2>
          <p className="text-body-sm text-slate-600 mb-6">
            Connect your calendar to automatically sync appointments and manage your schedule.
          </p>

          <div className="space-y-3">
            <button className="w-full p-4 border border-slate-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-body-sm font-semibold text-slate-900">Google Calendar</p>
                  <p className="text-caption text-slate-500">Connect your Google account</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
            </button>

            <button className="w-full p-4 border border-slate-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm-2-15v10h4V7h-4z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-body-sm font-semibold text-slate-900">Outlook Calendar</p>
                  <p className="text-caption text-slate-500">Connect your Microsoft account</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
            </button>

            <button className="w-full p-4 border border-slate-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 flex items-center justify-between group">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div className="text-left">
                  <p className="text-body-sm font-semibold text-slate-900">Apple Calendar</p>
                  <p className="text-caption text-slate-500">Connect via CalDAV</p>
                </div>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-slate-900">Upcoming Appointments</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  view === 'day' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  view === 'week' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  view === 'month' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {appointments.filter(a => a.status === 'upcoming').map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 border border-slate-200 rounded-xl hover:border-primary-600 hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${getTypeBadgeColor(appointment.type).replace('text-', 'bg-').replace('700', '100')}`}>
                      {getTypeIcon(appointment.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-body font-semibold text-slate-900 mb-1">
                        {appointment.title}
                      </h3>
                      <div className="flex items-center gap-4 text-body-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{appointment.attendees} attendee{appointment.attendees > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2 mt-2 text-body-sm text-slate-500">
                          <MapPin className="w-4 h-4" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${getTypeBadgeColor(appointment.type)}`}>
                    {appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                  </span>
                </div>
              </div>
            ))}

            {appointments.filter(a => a.status === 'upcoming').length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                  <CalendarIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-body-lg mb-1">No upcoming appointments</p>
                <p className="text-slate-500 text-body-sm">Schedule a new appointment to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
