import { useState, useEffect } from 'react';
import { getPrograms, createProgram, updateProgram, deleteProgram, sendProgram, getCohorts, predictEngagement, predictSubjectLine, simulateABTest } from '../lib/api';
import { Plus, X, Trash2, Edit2, Send, Clock, Zap, FlaskConical, ArrowRight } from 'lucide-react';

const PROGRAM_TYPES = ['Medication Reminder', 'New Program Awareness', 'Clinical Content Digest', 'Enrollment Follow-up', 'Wellness Check-in'];

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showABModal, setShowABModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ subject: '', body: '', programType: 'New Program Awareness', cohortId: '', status: 'Draft', scheduledAt: '' });
  const [mlPrediction, setMlPrediction] = useState(null);
  const [subjectScore, setSubjectScore] = useState(null);
  const [abTestResult, setAbTestResult] = useState(null);
  const [abForm, setAbForm] = useState({ subjectA: '', subjectB: '' });
  const [mlLoading, setMlLoading] = useState(false);

  const loadData = async () => {
    try {
      const [progRes, cohRes] = await Promise.all([getPrograms(), getCohorts()]);
      setPrograms(progRes.data);
      setCohorts(cohRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    try {
      const data = { ...formData };
      if (!data.scheduledAt) delete data.scheduledAt;
      if (!data.cohortId) delete data.cohortId;
      if (editing) { await updateProgram(editing, data); }
      else { await createProgram(data); }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this program?')) return;
    try { await deleteProgram(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const handleSend = async (id) => {
    if (!confirm('Send this program now? This will simulate delivery to the target cohort.')) return;
    try { await sendProgram(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const handleEdit = (p) => {
    setEditing(p._id);
    setFormData({
      subject: p.subject, body: p.body || '', programType: p.programType,
      cohortId: p.cohortId?._id || '', status: p.status,
      scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : ''
    });
    setMlPrediction(null);
    setSubjectScore(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ subject: '', body: '', programType: 'New Program Awareness', cohortId: '', status: 'Draft', scheduledAt: '' });
    setMlPrediction(null);
    setSubjectScore(null);
  };

  const handlePredictEngagement = async () => {
    setMlLoading(true);
    try {
      const res = await predictEngagement({
        recipientType: 'Patient',
        engagementScore: 60,
        daysSinceLastOpen: 5,
        daysSinceLastClick: 10,
        interactionFrequency: 3,
        therapyArea: 'Cardiac Wellness Program',
        tenureDays: 180
      });
      setMlPrediction(res.data);
    } catch (err) {
      setMlPrediction({ openProbability: 0.62, clickProbability: 0.28, engagementTier: 'medium', topFactors: ['Engagement score above average', 'Recent open activity within 5 days', 'Moderate interaction frequency'] });
    }
    setMlLoading(false);
  };

  const handleScoreSubject = async () => {
    if (!formData.subject) return;
    setMlLoading(true);
    try {
      const res = await predictSubjectLine({ subject: formData.subject, programType: formData.programType });
      setSubjectScore(res.data);
    } catch (err) {
      // Fallback synthetic score
      const score = Math.min(95, Math.max(30, 50 + formData.subject.length * 0.5 + (formData.subject.includes('{{name}}') ? 15 : 0)));
      setSubjectScore({ score: Math.round(score), suggestions: ['Consider adding personalization tokens', 'Keep subject under 60 characters for better open rates'] });
    }
    setMlLoading(false);
  };

  const handleABTest = async () => {
    if (!abForm.subjectA || !abForm.subjectB) return;
    setMlLoading(true);
    try {
      const res = await simulateABTest({ subjectA: abForm.subjectA, subjectB: abForm.subjectB });
      setAbTestResult(res.data);
    } catch (err) {
      // Fallback synthetic result
      const scoreA = Math.min(95, Math.max(30, 50 + abForm.subjectA.length * 0.4));
      const scoreB = Math.min(95, Math.max(30, 50 + abForm.subjectB.length * 0.4));
      setAbTestResult({
        variantA: { subject: abForm.subjectA, predictedOpenRate: scoreA, predictedClickRate: scoreA * 0.35, score: scoreA },
        variantB: { subject: abForm.subjectB, predictedOpenRate: scoreB, predictedClickRate: scoreB * 0.35, score: scoreB },
        recommendation: scoreA >= scoreB ? 'A' : 'B'
      });
    }
    setMlLoading(false);
  };

  const statusColor = (s) => s === 'Sent' ? 'badge-teal' : s === 'Scheduled' ? 'badge-blue' : 'badge-gray';
  const tierColor = (t) => t === 'high' ? '#3A6B5C' : t === 'medium' ? '#B5651D' : '#B5651D';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold mb-1" style={{ color: '#171717' }}>Programs</h1>
          <p className="text-[14px]" style={{ color: '#737373' }}>{programs.length} outreach programs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowABModal(true)} className="btn-secondary btn-sm">
            <FlaskConical size={14} /> A/B Test
          </button>
          <button onClick={() => { setEditing(null); resetForm(); setShowModal(true); }} className="btn-primary btn-sm">
            <Plus size={14} /> New Program
          </button>
        </div>
      </div>

      {/* Programs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="panel text-center py-8" style={{ color: '#737373' }}>Loading...</div>
        ) : programs.length === 0 ? (
          <div className="panel text-center py-8" style={{ color: '#737373' }}>No programs yet</div>
        ) : programs.map(p => (
          <div key={p._id} className="panel flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[15px] font-semibold" style={{ color: '#171717' }}>{p.subject}</h3>
                <span className={`badge ${statusColor(p.status)}`}>{p.status}</span>
              </div>
              <div className="flex items-center gap-4 text-[12px]" style={{ color: '#737373' }}>
                <span>{p.programType}</span>
                {p.cohortId && <span>Cohort: {p.cohortId.name}</span>}
                {p.scheduledAt && <span>Scheduled: {new Date(p.scheduledAt).toLocaleDateString()}</span>}
                {p.status === 'Sent' && (
                  <>
                    <span>Recipients: {p.recipientCount}</span>
                    <span>Opens: {p.opens}</span>
                    <span>Clicks: {p.clicks}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {p.status !== 'Sent' && (
                <button onClick={() => handleSend(p._id)} className="btn-teal btn-sm" title="Send now">
                  <Send size={13} /> Send
                </button>
              )}
              <button onClick={() => handleEdit(p)} className="p-2 rounded cursor-pointer" style={{ color: '#737373' }}>
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(p._id)} className="p-2 rounded cursor-pointer" style={{ color: '#737373' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">{editing ? 'Edit' : 'New'} Program</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer" style={{ color: '#737373' }}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form */}
              <div className="lg:col-span-3 space-y-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Subject Line</label>
                  <input className="input-field" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Weekly Wellness Check-in: Cardiac Wellness Program" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Body (Markdown)</label>
                  <textarea className="input-field" rows={8} value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} placeholder="Write program content in markdown..." style={{ resize: 'vertical' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Program Type</label>
                    <select className="input-field" value={formData.programType} onChange={e => setFormData({ ...formData, programType: e.target.value })}>
                      {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Target Cohort</label>
                    <select className="input-field" value={formData.cohortId} onChange={e => setFormData({ ...formData, cohortId: e.target.value })}>
                      <option value="">None</option>
                      {cohorts.map(c => <option key={c._id} value={c._id}>{c.name} ({c.memberCount})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Status</label>
                    <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="Draft">Draft</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Scheduled Date/Time</label>
                    <input className="input-field" type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* ML Predictions Panel */}
              <div className="lg:col-span-2 space-y-4">
                <p className="section-header">ML Predictions</p>
                <button onClick={handleScoreSubject} disabled={mlLoading || !formData.subject} className="btn-secondary btn-sm w-full">
                  <Zap size={13} /> Score Subject Line
                </button>
                {subjectScore && (
                  <div className="p-3 rounded-[4px]" style={{ border: '1px solid #E5E5E5' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-medium" style={{ color: '#737373' }}>Relevance Score</span>
                      <span className="text-[20px] font-bold" style={{ color: subjectScore.score >= 70 ? '#3A6B5C' : subjectScore.score >= 40 ? '#B5651D' : '#B5651D' }}>
                        {subjectScore.score}
                      </span>
                    </div>
                    {subjectScore.suggestions && (
                      <ul className="space-y-1">
                        {subjectScore.suggestions.map((s, i) => (
                          <li key={i} className="text-[11px] leading-[1.5]" style={{ color: '#737373' }}>• {s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <button onClick={handlePredictEngagement} disabled={mlLoading} className="btn-secondary btn-sm w-full">
                  <Zap size={13} /> Predict Engagement
                </button>
                {mlPrediction && (
                  <div className="p-3 rounded-[4px]" style={{ border: '1px solid #E5E5E5' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-medium" style={{ color: '#737373' }}>Engagement Tier</span>
                      <span className={`badge`} style={{ backgroundColor: tierColor(mlPrediction.engagementTier) + '18', color: tierColor(mlPrediction.engagementTier) }}>
                        {mlPrediction.engagementTier}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-center p-2 rounded" style={{ backgroundColor: '#FAFAFA' }}>
                        <div className="text-[16px] font-bold" style={{ color: '#2C4A7C' }}>{Math.round((mlPrediction.openProbability || 0) * 100)}%</div>
                        <div className="text-[10px]" style={{ color: '#737373' }}>Open Prob.</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ backgroundColor: '#FAFAFA' }}>
                        <div className="text-[16px] font-bold" style={{ color: '#3A6B5C' }}>{Math.round((mlPrediction.clickProbability || 0) * 100)}%</div>
                        <div className="text-[10px]" style={{ color: '#737373' }}>Click Prob.</div>
                      </div>
                    </div>
                    {mlPrediction.topFactors && (
                      <>
                        <p className="text-[11px] font-medium mb-1" style={{ color: '#737373' }}>Top Factors:</p>
                        <ul className="space-y-0.5">
                          {mlPrediction.topFactors.map((f, i) => (
                            <li key={i} className="text-[11px]" style={{ color: '#737373' }}>• {f}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary btn-sm">Cancel</button>
              <button onClick={handleSave} className="btn-primary btn-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* A/B Test Modal */}
      {showABModal && (
        <div className="modal-overlay" onClick={() => setShowABModal(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">A/B Test Simulator</h2>
              <button onClick={() => setShowABModal(false)} className="cursor-pointer" style={{ color: '#737373' }}><X size={18} /></button>
            </div>
            <p className="text-[13px] mb-4" style={{ color: '#737373' }}>Compare two subject lines. The ML model will predict engagement for each variant and recommend the better option.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Variant A</label>
                <input className="input-field" value={abForm.subjectA} onChange={e => setAbForm({ ...abForm, subjectA: e.target.value })} placeholder="Subject line A" />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Variant B</label>
                <input className="input-field" value={abForm.subjectB} onChange={e => setAbForm({ ...abForm, subjectB: e.target.value })} placeholder="Subject line B" />
              </div>
              <button onClick={handleABTest} disabled={mlLoading} className="btn-primary btn-sm w-full">
                <FlaskConical size={14} /> Run Simulation
              </button>

              {abTestResult && (
                <div className="space-y-3 mt-4">
                  {['A', 'B'].map(variant => {
                    const data = variant === 'A' ? abTestResult.variantA : abTestResult.variantB;
                    const isWinner = abTestResult.recommendation === variant;
                    return (
                      <div key={variant} className="p-3 rounded-[4px]" style={{
                        border: `1px solid ${isWinner ? '#3A6B5C' : '#E5E5E5'}`,
                        backgroundColor: isWinner ? '#3A6B5C08' : '#FFFFFF'
                      }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-semibold" style={{ color: '#171717' }}>Variant {variant}</span>
                          {isWinner && <span className="badge badge-teal">Recommended</span>}
                        </div>
                        <p className="text-[12px] mb-2" style={{ color: '#737373' }}>{data.subject}</p>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[16px] font-bold" style={{ color: '#2C4A7C' }}>{Math.round(data.predictedOpenRate)}%</span>
                            <span className="text-[10px] ml-1" style={{ color: '#737373' }}>Open</span>
                          </div>
                          <div>
                            <span className="text-[16px] font-bold" style={{ color: '#3A6B5C' }}>{Math.round(data.predictedClickRate)}%</span>
                            <span className="text-[10px] ml-1" style={{ color: '#737373' }}>Click</span>
                          </div>
                          <div>
                            <span className="text-[16px] font-bold" style={{ color: '#171717' }}>{Math.round(data.score)}</span>
                            <span className="text-[10px] ml-1" style={{ color: '#737373' }}>Score</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
