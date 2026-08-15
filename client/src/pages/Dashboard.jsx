import { useState, useEffect } from 'react';
import { getDashboardStats } from '../lib/api';
import { Users, UserCheck, Mail, TrendingUp, Clock, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: '#737373' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-[15px] font-medium mb-2" style={{ color: '#171717' }}>Unable to load dashboard data</p>
          <p className="text-[13px]" style={{ color: '#737373' }}>Make sure the server is running and MongoDB is connected.</p>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Recipients', value: stats.recipients.total, icon: Users, color: '#2C4A7C' },
    { label: 'HCP Recipients', value: stats.recipients.hcp, icon: UserCheck, color: '#2C4A7C' },
    { label: 'Patient Recipients', value: stats.recipients.patient, icon: Users, color: '#3A6B5C' },
    { label: 'Programs Sent', value: stats.programs.sent, icon: Send, color: '#2C4A7C' },
    { label: 'Avg Open Rate', value: `${Math.round((stats.programStats.avgOpenRate || 0) * 100)}%`, icon: Mail, color: '#3A6B5C' },
    { label: 'Avg Engagement', value: Math.round(stats.averages.engagement), icon: TrendingUp, color: '#2C4A7C' }
  ];

  const engagementByArea = [
    ...(stats.patientEngagement || []).map(e => ({
      name: (e._id || 'Unknown').replace(' Program', ''),
      score: Math.round(e.avgAdherence || 0),
      count: e.count,
      type: 'Patient'
    })),
    ...(stats.hcpEngagement || []).map(e => ({
      name: e._id || 'Unknown',
      score: Math.round(e.avgEngagement || 0),
      count: e.count,
      type: 'HCP'
    }))
  ];

  const pieData = [
    { name: 'HCP', value: stats.recipients.hcp },
    { name: 'Patient', value: stats.recipients.patient }
  ];

  const programPerf = (stats.programPerformance || []).map(p => ({
    name: p.subject.length > 25 ? p.subject.slice(0, 25) + '...' : p.subject,
    opens: p.recipientCount > 0 ? Math.round((p.opens / p.recipientCount) * 100) : 0,
    clicks: p.recipientCount > 0 ? Math.round((p.clicks / p.recipientCount) * 100) : 0
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold mb-1" style={{ color: '#171717' }}>Dashboard</h1>
        <p className="text-[14px]" style={{ color: '#737373' }}>Platform engagement overview and key metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {summaryCards.map((card, i) => (
          <div key={i} className="panel card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <card.icon size={16} style={{ color: card.color }} />
              <span className="text-[12px] font-medium" style={{ color: '#737373' }}>{card.label}</span>
            </div>
            <div className="text-[28px] font-bold" style={{ color: '#171717' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Engagement by Area */}
        <div className="panel lg:col-span-2">
          <p className="section-header mb-4">Engagement by Area</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={engagementByArea} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
              <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 13 }}
              />
              <Bar dataKey="score" fill="#2C4A7C" radius={[3, 3, 0, 0]} name="Avg Score" />
              <Bar dataKey="count" fill="#3A6B5C" radius={[3, 3, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recipient Split */}
        <div className="panel">
          <p className="section-header mb-4">Recipient Split</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" paddingAngle={2}>
                <Cell fill="#2C4A7C" />
                <Cell fill="#3A6B5C" />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#2C4A7C' }} />
              <span className="text-[12px]" style={{ color: '#737373' }}>HCP ({stats.recipients.hcp})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3A6B5C' }} />
              <span className="text-[12px]" style={{ color: '#737373' }}>Patient ({stats.recipients.patient})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Program Performance + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program Performance Chart */}
        <div className="panel lg:col-span-2">
          <p className="section-header mb-4">Program Performance (Open & Click Rates %)</p>
          {programPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={programPerf} layout="vertical" barCategoryGap="15%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 13 }} />
                <Bar dataKey="opens" fill="#2C4A7C" radius={[0, 3, 3, 0]} name="Open Rate %" />
                <Bar dataKey="clicks" fill="#3A6B5C" radius={[0, 3, 3, 0]} name="Click Rate %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-[13px]" style={{ color: '#737373' }}>No sent programs yet</p>
            </div>
          )}
        </div>

        {/* Recent Programs */}
        <div className="panel">
          <p className="section-header mb-4">Recent Programs</p>
          <div className="space-y-3">
            {(stats.recentPrograms || []).map((program, i) => (
              <div key={i} className="p-3 rounded-[4px]" style={{ border: '1px solid #E5E5E5' }}>
                <p className="text-[13px] font-medium mb-1 leading-snug" style={{ color: '#171717' }}>
                  {program.subject}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`badge ${program.status === 'Sent' ? 'badge-teal' : program.status === 'Scheduled' ? 'badge-blue' : 'badge-gray'}`}>
                    {program.status}
                  </span>
                  <span className="text-[11px]" style={{ color: '#737373' }}>{program.programType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Program Status Breakdown */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="panel text-center">
          <Clock size={18} style={{ color: '#737373', margin: '0 auto 8px' }} />
          <div className="text-[24px] font-bold" style={{ color: '#171717' }}>{stats.programs.draft}</div>
          <p className="text-[12px] font-medium" style={{ color: '#737373' }}>Drafts</p>
        </div>
        <div className="panel text-center">
          <Clock size={18} style={{ color: '#2C4A7C', margin: '0 auto 8px' }} />
          <div className="text-[24px] font-bold" style={{ color: '#171717' }}>{stats.programs.scheduled}</div>
          <p className="text-[12px] font-medium" style={{ color: '#737373' }}>Scheduled</p>
        </div>
        <div className="panel text-center">
          <Send size={18} style={{ color: '#3A6B5C', margin: '0 auto 8px' }} />
          <div className="text-[24px] font-bold" style={{ color: '#171717' }}>{stats.programs.sent}</div>
          <p className="text-[12px] font-medium" style={{ color: '#737373' }}>Sent</p>
        </div>
      </div>
    </div>
  );
}
