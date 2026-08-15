import { useState, useEffect, useRef } from 'react';
import { getRecipients, createRecipient, updateRecipient, deleteRecipient, importRecipients, getCohorts, createCohort, deleteCohort } from '../lib/api';
import { Plus, Search, Upload, X, Trash2, Edit2, Filter, Users, UserCheck } from 'lucide-react';

const SPECIALTIES = ['Cardiology', 'Oncology', 'Endocrinology', 'General Practice'];
const THERAPY_AREAS = ['Cardiac Wellness Program', 'Metabolic Health Program', 'Respiratory Care Program'];
const HOSPITALS = ['Greenfield Medical Center', 'Lakewood Health System', 'Riverdale Community Hospital', 'Summit Medical Associates', 'Westbrook Clinical Partners', 'Elmwood Health Network'];

export default function Recipients() {
  const [recipients, setRecipients] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ type: 'Patient', name: '', email: '', specialty: '', therapyArea: '', hospitalClinic: '', engagementScore: 50, adherenceScore: 50, subscribed: true });
  const [cohortForm, setCohortForm] = useState({ name: '', description: '', filterCriteria: { type: '', specialty: '', therapyArea: '', minEngagement: '', maxEngagement: '' } });
  const fileRef = useRef(null);

  const loadData = async () => {
    try {
      const [recRes, cohRes] = await Promise.all([getRecipients(filter), getCohorts()]);
      setRecipients(recRes.data);
      setCohorts(cohRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filter.type]);

  const handleSearch = () => { loadData(); };

  const handleSave = async () => {
    try {
      if (editing) { await updateRecipient(editing, formData); }
      else { await createRecipient(formData); }
      setShowModal(false);
      setEditing(null);
      setFormData({ type: 'Patient', name: '', email: '', specialty: '', therapyArea: '', hospitalClinic: '', engagementScore: 50, adherenceScore: 50, subscribed: true });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this recipient?')) return;
    try { await deleteRecipient(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const handleEdit = (r) => {
    setEditing(r._id);
    setFormData({ type: r.type, name: r.name, email: r.email, specialty: r.specialty || '', therapyArea: r.therapyArea || '', hospitalClinic: r.hospitalClinic || '', engagementScore: r.engagementScore, adherenceScore: r.adherenceScore || 50, subscribed: r.subscribed });
    setShowModal(true);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await importRecipients(fd);
      alert(`Imported ${res.data.imported} recipients`);
      setShowImportModal(false);
      loadData();
    } catch (err) { alert('Import failed: ' + err.message); }
  };

  const handleSaveCohort = async () => {
    try {
      const data = { ...cohortForm };
      // Clean empty fields
      Object.keys(data.filterCriteria).forEach(k => {
        if (data.filterCriteria[k] === '' || data.filterCriteria[k] === undefined) delete data.filterCriteria[k];
        if (k === 'minEngagement' || k === 'maxEngagement') {
          if (data.filterCriteria[k] !== undefined) data.filterCriteria[k] = Number(data.filterCriteria[k]);
        }
      });
      await createCohort(data);
      setShowCohortModal(false);
      setCohortForm({ name: '', description: '', filterCriteria: { type: '', specialty: '', therapyArea: '', minEngagement: '', maxEngagement: '' } });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteCohort = async (id) => {
    if (!confirm('Delete this cohort?')) return;
    try { await deleteCohort(id); loadData(); }
    catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold mb-1" style={{ color: '#171717' }}>Recipients</h1>
          <p className="text-[14px]" style={{ color: '#737373' }}>{recipients.length} recipients across all programs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-secondary btn-sm">
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => setShowCohortModal(true)} className="btn-secondary btn-sm">
            <Filter size={14} /> New Cohort
          </button>
          <button onClick={() => { setEditing(null); setFormData({ type: 'Patient', name: '', email: '', specialty: '', therapyArea: '', hospitalClinic: '', engagementScore: 50, adherenceScore: 50, subscribed: true }); setShowModal(true); }} className="btn-primary btn-sm">
            <Plus size={14} /> Add Recipient
          </button>
        </div>
      </div>

      {/* Cohorts */}
      {cohorts.length > 0 && (
        <div className="mb-6">
          <p className="section-header mb-3">Saved Cohorts</p>
          <div className="flex flex-wrap gap-2">
            {cohorts.map(c => (
              <div key={c._id} className="flex items-center gap-2 px-3 py-2 rounded-[4px]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5E5' }}>
                <Users size={13} style={{ color: '#2C4A7C' }} />
                <span className="text-[13px] font-medium" style={{ color: '#171717' }}>{c.name}</span>
                <span className="text-[12px]" style={{ color: '#737373' }}>({c.memberCount})</span>
                <button onClick={() => handleDeleteCohort(c._id)} className="ml-1 cursor-pointer" style={{ color: '#737373' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <Search size={16} style={{ color: '#737373' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-field"
            style={{ maxWidth: 300 }}
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select className="input-field" style={{ width: 160 }} value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="HCP">HCP</option>
          <option value="Patient">Patient</option>
        </select>
        <button onClick={handleSearch} className="btn-secondary btn-sm">Search</button>
      </div>

      {/* Table */}
      <div className="panel p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Specialty / Therapy Area</th>
              <th>Score</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8" style={{ color: '#737373' }}>Loading...</td></tr>
            ) : recipients.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8" style={{ color: '#737373' }}>No recipients found</td></tr>
            ) : recipients.map(r => (
              <tr key={r._id}>
                <td className="font-medium">{r.name}</td>
                <td>
                  <span className={`badge ${r.type === 'HCP' ? 'badge-blue' : 'badge-teal'}`}>{r.type}</span>
                </td>
                <td style={{ color: '#737373' }}>{r.email}</td>
                <td>{r.type === 'HCP' ? r.specialty : r.therapyArea}</td>
                <td>
                  <span className="text-[13px] font-medium" style={{
                    color: (r.type === 'HCP' ? r.engagementScore : r.adherenceScore) >= 70 ? '#3A6B5C' :
                           (r.type === 'HCP' ? r.engagementScore : r.adherenceScore) >= 40 ? '#B5651D' : '#B5651D'
                  }}>
                    {r.type === 'HCP' ? r.engagementScore : r.adherenceScore}
                  </span>
                </td>
                <td>
                  {r.subscribed
                    ? <span className="badge badge-teal">Active</span>
                    : <span className="badge badge-gray">Inactive</span>
                  }
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded cursor-pointer" style={{ color: '#737373' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded cursor-pointer" style={{ color: '#737373' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">{editing ? 'Edit' : 'Add'} Recipient</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer" style={{ color: '#737373' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Type</label>
                <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="Patient">Patient</option>
                  <option value="HCP">HCP</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Name</label>
                  <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Email</label>
                  <input className="input-field" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                </div>
              </div>
              {formData.type === 'HCP' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Specialty</label>
                    <select className="input-field" value={formData.specialty} onChange={e => setFormData({ ...formData, specialty: e.target.value })}>
                      <option value="">Select specialty</option>
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Hospital/Clinic</label>
                    <select className="input-field" value={formData.hospitalClinic} onChange={e => setFormData({ ...formData, hospitalClinic: e.target.value })}>
                      <option value="">Select facility</option>
                      {HOSPITALS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Therapy Area</label>
                  <select className="input-field" value={formData.therapyArea} onChange={e => setFormData({ ...formData, therapyArea: e.target.value })}>
                    <option value="">Select therapy area</option>
                    {THERAPY_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>
                    {formData.type === 'HCP' ? 'Engagement' : 'Adherence'} Score
                  </label>
                  <input className="input-field" type="number" min="0" max="100"
                    value={formData.type === 'HCP' ? formData.engagementScore : formData.adherenceScore}
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (formData.type === 'HCP') setFormData({ ...formData, engagementScore: val });
                      else setFormData({ ...formData, adherenceScore: val });
                    }}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.subscribed} onChange={e => setFormData({ ...formData, subscribed: e.target.checked })} className="w-4 h-4" />
                    <span className="text-[13px] font-medium" style={{ color: '#171717' }}>Subscribed</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary btn-sm">Cancel</button>
              <button onClick={handleSave} className="btn-primary btn-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Cohort Modal */}
      {showCohortModal && (
        <div className="modal-overlay" onClick={() => setShowCohortModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">Create Cohort</h2>
              <button onClick={() => setShowCohortModal(false)} className="cursor-pointer" style={{ color: '#737373' }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Cohort Name</label>
                <input className="input-field" value={cohortForm.name} onChange={e => setCohortForm({ ...cohortForm, name: e.target.value })} placeholder="e.g., Low-Adherence Cardiac Patients" />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Description</label>
                <input className="input-field" value={cohortForm.description} onChange={e => setCohortForm({ ...cohortForm, description: e.target.value })} placeholder="Brief description" />
              </div>
              <p className="section-header mt-4">Filter Criteria</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Recipient Type</label>
                  <select className="input-field" value={cohortForm.filterCriteria.type} onChange={e => setCohortForm({ ...cohortForm, filterCriteria: { ...cohortForm.filterCriteria, type: e.target.value } })}>
                    <option value="">Any</option>
                    <option value="HCP">HCP</option>
                    <option value="Patient">Patient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Specialty</label>
                  <select className="input-field" value={cohortForm.filterCriteria.specialty} onChange={e => setCohortForm({ ...cohortForm, filterCriteria: { ...cohortForm.filterCriteria, specialty: e.target.value } })}>
                    <option value="">Any</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Therapy Area</label>
                  <select className="input-field" value={cohortForm.filterCriteria.therapyArea} onChange={e => setCohortForm({ ...cohortForm, filterCriteria: { ...cohortForm.filterCriteria, therapyArea: e.target.value } })}>
                    <option value="">Any</option>
                    {THERAPY_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#737373' }}>Min Score</label>
                  <input className="input-field" type="number" min="0" max="100" placeholder="0"
                    value={cohortForm.filterCriteria.minEngagement}
                    onChange={e => setCohortForm({ ...cohortForm, filterCriteria: { ...cohortForm.filterCriteria, minEngagement: e.target.value } })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCohortModal(false)} className="btn-secondary btn-sm">Cancel</button>
              <button onClick={handleSaveCohort} className="btn-primary btn-sm">Create Cohort</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">Import Recipients</h2>
              <button onClick={() => setShowImportModal(false)} className="cursor-pointer" style={{ color: '#737373' }}><X size={18} /></button>
            </div>
            <div className="p-8 rounded-[6px] text-center cursor-pointer" style={{ border: '2px dashed #E5E5E5' }}
              onClick={() => fileRef.current?.click()}>
              <Upload size={24} style={{ color: '#737373', margin: '0 auto 8px' }} />
              <p className="text-[14px] font-medium mb-1" style={{ color: '#171717' }}>Click to upload CSV</p>
              <p className="text-[12px]" style={{ color: '#737373' }}>Required columns: name, email, type. Optional: specialty, therapyArea, engagementScore</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>
        </div>
      )}
    </div>
  );
}
