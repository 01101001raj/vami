import { useState } from 'react';
import { Users, Plus, Settings, Mail, MoreVertical, UserPlus, Shield, Crown } from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  avatar?: string;
  joinedDate: string;
  lastActive: string;
}

// Mock data - in production this would come from API
const mockTeamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john@company.com',
    role: 'owner',
    status: 'active',
    joinedDate: '2024-01-15',
    lastActive: 'Just now'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'admin',
    status: 'active',
    joinedDate: '2024-02-20',
    lastActive: '5 min ago'
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael@company.com',
    role: 'member',
    status: 'active',
    joinedDate: '2024-03-10',
    lastActive: '2 hours ago'
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@company.com',
    role: 'member',
    status: 'pending',
    joinedDate: '2025-11-07',
    lastActive: 'Never'
  }
];

export default function TeamPage() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-primary-600" />;
      case 'member':
        return <Users className="w-4 h-4 text-slate-600" />;
      default:
        return <Users className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-700';
      case 'admin':
        return 'bg-primary-100 text-primary-700';
      case 'member':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'inactive':
        return 'badge-neutral';
      default:
        return 'badge-neutral';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-slate-900 mb-2">
            Team
          </h1>
          <p className="text-body text-slate-600">Manage your team members and their permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <Settings className="w-4 h-4" />
            Team Settings
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="metric-label">Total Members</p>
          <p className="metric-value">{teamMembers.length}</p>
          <p className="text-caption text-primary-600 font-medium mt-2">Active team</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="metric-label">Active</p>
          <p className="metric-value">
            {teamMembers.filter(m => m.status === 'active').length}
          </p>
          <p className="text-caption text-green-600 font-medium mt-2">Online now</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <UserPlus className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="metric-label">Pending</p>
          <p className="metric-value">
            {teamMembers.filter(m => m.status === 'pending').length}
          </p>
          <p className="text-caption text-yellow-600 font-medium mt-2">Invitations</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="metric-label">Admins</p>
          <p className="metric-value">
            {teamMembers.filter(m => m.role === 'admin' || m.role === 'owner').length}
          </p>
          <p className="text-caption text-purple-600 font-medium mt-2">With privileges</p>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="table-container">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-h2 text-slate-900">Team Members</h2>
          <p className="text-body-sm text-slate-600 mt-1">Manage team member access and permissions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <p className="text-body-sm font-semibold text-slate-900">{member.name}</p>
                        <div className="flex items-center space-x-2 text-caption text-slate-500">
                          <Mail className="w-3 h-3" />
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeColor(member.role)}`}>
                      {getRoleIcon(member.role)}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(member.status)}`}>
                      {member.status === 'active' && (
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                      )}
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <p className="text-body-sm text-slate-700">
                      {new Date(member.joinedDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </td>
                  <td>
                    <p className="text-body-sm text-slate-700">{member.lastActive}</p>
                  </td>
                  <td>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-slate-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-h2 text-slate-900 mb-4">Invite Team Members</h2>
          <p className="text-body-sm text-slate-600 mb-6">
            Send invitations to team members via email
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="colleague@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select className="input">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary w-full">
              <Mail className="w-4 h-4" />
              Send Invitation
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-h2 text-slate-900 mb-4">Role Permissions</h2>
          <p className="text-body-sm text-slate-600 mb-6">
            Understanding team member permissions
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <h3 className="text-body-sm font-semibold text-yellow-900">Owner</h3>
              </div>
              <p className="text-body-sm text-yellow-800">
                Full access to all features, billing, and team management
              </p>
            </div>

            <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <h3 className="text-body-sm font-semibold text-primary-900">Admin</h3>
              </div>
              <p className="text-body-sm text-primary-800">
                Can manage team members, AI agent settings, and view analytics
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-slate-600" />
                <h3 className="text-body-sm font-semibold text-slate-900">Member</h3>
              </div>
              <p className="text-body-sm text-slate-700">
                Can make calls and view basic analytics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
