import { useState, useEffect } from 'react';
import { getPrograms, getProgramAnalytics } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Mail, MousePointer, Users } from 'lucide-react';

export default function Analytics() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programDetail, setProgramDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrograms({ status: 'Sent' })
      .then(res => {
        setPrograms(res.data);
        if (res.data.length > 0) selectProgram(res.data[0]._id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const selectProgram = async (id) => {
    setSelectedProgram(id);
    try {
      const res = await getProgramAnalytics(id);
      setProgramDetail(res.data);
    } catch (err) { console.error(err); }
  };

  const chartData = programs.map(p => ({
    name: p.subject.length > 20 ? p.subject.slice(0, 20) + '...' : p.subject,
    openRate: p.recipientCount > 0 ? Math.round((p.opens / p.recipientCount) * 100) : 0,
    clickRate: p.recipientCount > 0 ? Math.round((p.clicks / p.recipientCount) * 100) : 0,
    recipients: p.recipientCount
  }));

  const timelineData = programs.map((p, i) => ({
    date: p.sentAt ? new Date(p.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Program ${i + 1}`,
    opens: p.opens,
    clicks: p.clicks,
    sent: p.recipientCount
  })).reverse();

  const totalSent = programs.reduce((a, p) => a + (p.recipientCount || 0), 0);
  const totalOpens = programs.reduce((a, p) => a + (p.opens || 0), 0);
  const totalClicks = programs.reduce((a, p) => a + (p.clicks || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-semibold mb-1" style={{ color: '#171717' }}>Analytics</h1>
        <p className="text-[14px]" style={{ color: '#737373' }}>Program performance and engagement metrics</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Programs Sent', value: programs.length, icon: Mail, color: '#2C4A7C' },
          { label: 'Total Recipients', value: totalSent, icon: Users, color: '#2C4A7C' },
          { label: 'Total Opens', value: totalOpens, icon: TrendingUp, color: '#3A6B5C' },
          { label: 'Avg Open Rate', value: `${avgOpenRate}%`, icon: TrendingUp, color: '#3A6B5C' },
          { label: 'Avg Click Rate', value: `${avgClickRate}%`, icon: MousePointer, color: '#3A6B5C' }
        ].map((card, i) => (
          <div key={i} className="panel card-shadow">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={14} style={{ color: card.color }} />
              <span className="text-[12px] font-medium" style={{ color: '#737373' }}>{card.label}</span>
            </div>
            <div className="text-[24px] font-bold" style={{ color: '#171717' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Open & Click Rates */}
        <div className="panel">
          <p className="section-header mb-4">Open & Click Rates by Program (%)</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
                <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="openRate" fill="#2C4A7C" radius={[3, 3, 0, 0]} name="Open Rate %" />
                <Bar dataKey="clickRate" fill="#3A6B5C" radius={[3, 3, 0, 0]} name="Click Rate %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-[13px]" style={{ color: '#737373' }}>No sent programs to display</p>
            </div>
          )}
        </div>

        {/* Engagement Timeline */}
        <div className="panel">
          <p className="section-header mb-4">Engagement Timeline</p>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
                <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={{ stroke: '#E5E5E5' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 6, fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="opens" stroke="#2C4A7C" strokeWidth={2} dot={{ fill: '#2C4A7C', r: 3 }} name="Opens" />
                <Line type="monotone" dataKey="clicks" stroke="#3A6B5C" strokeWidth={2} dot={{ fill: '#3A6B5C', r: 3 }} name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-[13px]" style={{ color: '#737373' }}>No data to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Per-Program Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel">
          <p className="section-header mb-3">Sent Programs</p>
          <div className="space-y-2">
            {programs.map(p => (
              <button
                key={p._id}
                onClick={() => selectProgram(p._id)}
                className="w-full text-left p-3 rounded-[4px] transition-colors cursor-pointer"
                style={{
                  border: `1px solid ${selectedProgram === p._id ? '#2C4A7C' : '#E5E5E5'}`,
                  backgroundColor: selectedProgram === p._id ? '#2C4A7C08' : '#FFFFFF'
                }}
              >
                <p className="text-[13px] font-medium leading-snug mb-0.5" style={{ color: '#171717' }}>{p.subject}</p>
                <p className="text-[11px]" style={{ color: '#737373' }}>
                  {p.sentAt ? new Date(p.sentAt).toLocaleDateString() : 'N/A'} · {p.recipientCount} recipients
                </p>
              </button>
            ))}
          </div>
        </div>

        {programDetail && (
          <div className="panel lg:col-span-2">
            <p className="section-header mb-3">Program Detail</p>
            <h3 className="text-[16px] font-semibold mb-4" style={{ color: '#171717' }}>{programDetail.program.subject}</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Recipients', value: programDetail.metrics.recipientCount, color: '#2C4A7C' },
                { label: 'Open Rate', value: `${programDetail.metrics.openRate}%`, color: '#2C4A7C' },
                { label: 'Click Rate', value: `${programDetail.metrics.clickRate}%`, color: '#3A6B5C' }
              ].map((m, i) => (
                <div key={i} className="text-center p-4 rounded-[4px]" style={{ backgroundColor: '#FAFAFA' }}>
                  <div className="text-[24px] font-bold" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[12px] font-medium" style={{ color: '#737373' }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[12px] font-medium" style={{ color: '#737373' }}>Program Type</span>
                <p className="text-[14px]" style={{ color: '#171717' }}>{programDetail.program.programType}</p>
              </div>
              <div>
                <span className="text-[12px] font-medium" style={{ color: '#737373' }}>Sent Date</span>
                <p className="text-[14px]" style={{ color: '#171717' }}>
                  {programDetail.program.sentAt ? new Date(programDetail.program.sentAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[12px] font-medium" style={{ color: '#737373' }}>Click-to-Open Rate</span>
                <p className="text-[14px]" style={{ color: '#171717' }}>{programDetail.metrics.clickToOpenRate}%</p>
              </div>
              <div>
                <span className="text-[12px] font-medium" style={{ color: '#737373' }}>Total Opens / Clicks</span>
                <p className="text-[14px]" style={{ color: '#171717' }}>{programDetail.metrics.opens} / {programDetail.metrics.clicks}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
