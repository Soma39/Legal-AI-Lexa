import React, { useState, useEffect } from 'react';
import { 
  Crown, Users, FileText, Upload, Activity, ShieldCheck, 
  Trash2, AlertCircle, Check, RefreshCw, BarChart2, ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { User, LegalDocumentItem, SystemStats } from '../types';

export const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<LegalDocumentItem[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'users' | 'feedback' | 'audit'>('overview');
  
  // Document Upload State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Act');
  const [docJurisdiction, setDocJurisdiction] = useState('India');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, docsRes, usersRes, fbRes, logsRes] = await Promise.all([
        api.get<SystemStats>('/admin/system-stats'),
        api.get<LegalDocumentItem[]>('/admin/documents'),
        api.get<User[]>('/admin/users'),
        api.get<any[]>('/admin/feedback'),
        api.get<any[]>('/admin/audit-logs'),
      ]);
      setStats(statsRes.data);
      setDocuments(docsRes.data);
      setUsers(usersRes.data);
      setFeedback(fbRes.data);
      setAuditLogs(logsRes.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !docTitle.trim()) {
      setError('Please select a file and specify a title.');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('title', docTitle.trim());
    formData.append('document_type', docType);
    formData.append('jurisdiction', docJurisdiction);
    formData.append('file', docFile);

    try {
      await api.post('/admin/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`Document "${docTitle}" successfully uploaded, parsed, and indexed into the vector store!`);
      setDocTitle('');
      setDocFile(null);
      fetchAdminData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document and delete its vector store chunks?')) return;
    try {
      await api.delete(`/admin/documents/${id}`);
      fetchAdminData();
      setMessage('Document and vector embeddings successfully deleted.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role?new_role=${newRole}`);
      fetchAdminData();
      setMessage('User role updated.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-50 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-500/30 text-gold-700 dark:text-gold-400 text-xs font-semibold mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>Administrator Control Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
            System & Knowledge Base Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage legal documents, inspect ingestion status, review user feedback, and monitor audit trails.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-navy-900 p-1 rounded-xl">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart2 },
            { id: 'documents', label: 'Legal Corpus', icon: FileText },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'feedback', label: 'Feedback', icon: ShieldCheck },
            { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-gold-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab: Overview */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Users
              </span>
              <span className="text-3xl font-extrabold text-navy-900 dark:text-white">{stats.total_users}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Consultations
              </span>
              <span className="text-3xl font-extrabold text-navy-900 dark:text-white">{stats.total_conversations}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Indexed Chunks
              </span>
              <span className="text-3xl font-extrabold text-gold-600 dark:text-gold-400">{stats.vector_store_chunks_count}</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Positive Feedback
              </span>
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {Math.round(stats.positive_feedback_ratio * 100)}%
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-navy-900 dark:text-white">Active System Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block">LLM Provider Mode</span>
                <span className="font-bold text-navy-900 dark:text-white uppercase">{stats.llm_provider}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block">Environment</span>
                <span className="font-bold text-navy-900 dark:text-white capitalize">{stats.environment}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
                <span className="text-slate-400 block">Generated Drafts</span>
                <span className="font-bold text-navy-900 dark:text-white">{stats.total_drafts} Documents</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Legal Corpus & Ingestion */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-navy-800">
              <Upload className="w-4 h-4 text-gold-500" />
              <h3 className="font-bold text-sm text-navy-900 dark:text-white">Ingest Legal Document</h3>
            </div>
            <form onSubmit={handleDocumentUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Act / Document Title
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Arbitration and Conciliation Act, 1996"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-xs text-slate-900 dark:text-white outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-xs text-slate-900 dark:text-white outline-none"
                >
                  <option value="Act">Act / Statute</option>
                  <option value="Rule">Statutory Rule / Regulation</option>
                  <option value="Notification">Gazette Notification</option>
                  <option value="Judgment">Verified Court Judgment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File (.pdf or .txt)
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.txt"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy-900 file:text-white dark:file:bg-gold-500 dark:file:text-navy-950 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 rounded-lg bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 font-bold text-xs shadow transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white dark:border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Reindex</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Existing Documents List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Indexed Documents ({documents.length})
            </h3>
            <div className="space-y-2">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-navy-900 dark:text-white">{d.title}</span>
                    <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 font-semibold">
                        {d.document_type}
                      </span>
                      <span>•</span>
                      <span>Jurisdiction: {d.jurisdiction}</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-semibold uppercase">{d.ingestion_status}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDocument(d.id)}
                    className="p-2 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                    title="Remove from index"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: User Management */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">Registered Users ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Registered</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50">
                    <td className="p-3">
                      <span className="font-bold text-navy-900 dark:text-white block">{u.full_name}</span>
                      <span className="text-slate-400 text-[11px]">{u.email}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-500 font-semibold">{u.is_active ? 'Active' : 'Suspended'}</span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-2">
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleRoleChange(u.id, 'admin')}
                          className="text-gold-600 dark:text-gold-400 font-semibold hover:underline"
                        >
                          Make Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(u.id, 'user')}
                          className="text-slate-400 hover:underline"
                        >
                          Demote to User
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Feedback */}
      {activeTab === 'feedback' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">
            User Feedback on Answers & Citations ({feedback.length})
          </h3>
          {feedback.length === 0 ? (
            <p className="text-xs text-slate-400">No feedback submissions received yet.</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => (
                <div key={f.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 text-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.is_helpful ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {f.is_helpful ? 'Helpful' : 'Unhelpful'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Citation Accurate: <strong>{f.citation_accurate ? 'Yes' : 'Unverified'}</strong>
                      </span>
                    </div>
                    {f.comments && <p className="text-slate-600 dark:text-slate-300 italic">"{f.comments}"</p>}
                  </div>
                  <span className="text-slate-400 text-[11px]">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">
            Security & Compliance Audit Trails ({auditLogs.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-navy-950 text-slate-400 uppercase text-[10px] font-sans border-b border-slate-200 dark:border-navy-800">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Resource</th>
                  <th className="p-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="text-slate-600 dark:text-slate-300">
                    <td className="p-2.5 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-2.5 font-bold text-navy-900 dark:text-gold-400">{log.action}</td>
                    <td className="p-2.5">{log.resource_type}</td>
                    <td className="p-2.5 truncate max-w-xs">{JSON.stringify(log.details_json)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
