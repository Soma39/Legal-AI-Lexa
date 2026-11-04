import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Download, Trash2, Check, AlertTriangle, 
  Lock, Save, RefreshCw, FileText, UserX, ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { PrivacyPreferences } from '../types';
import { useAuth } from '../context/AuthContext';

export const PrivacyPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [preferences, setPreferences] = useState<PrivacyPreferences | null>(null);
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [consentRetention, setConsentRetention] = useState<boolean>(true);
  const [consentPersonalization, setConsentPersonalization] = useState<boolean>(true);
  const [analyticsOptIn, setAnalyticsOptIn] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.get<PrivacyPreferences>('/privacy/preferences');
      setPreferences(res.data);
      setRetentionDays(res.data.retention_days);
      setConsentRetention(res.data.consent_data_retention);
      setConsentPersonalization(res.data.consent_personalization);
      setAnalyticsOptIn(res.data.analytics_opt_in);
    } catch (err) {
      console.error('Error fetching privacy preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put<PrivacyPreferences>('/privacy/preferences', {
        retention_days: Number(retentionDays),
        consent_data_retention: consentRetention,
        consent_personalization: consentPersonalization,
        analytics_opt_in: analyticsOptIn,
      });
      setPreferences(res.data);
      setStatusMessage('Privacy preferences successfully saved.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/privacy/export');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `legalai_user_data_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMessage('Personal data archive successfully downloaded.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to permanently clear all your chat conversations? This cannot be undone.')) return;
    try {
      await api.delete('/privacy/clear-history');
      setStatusMessage('Chat history permanently cleared from database.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/privacy/delete-account');
      alert('Your account and all associated personal data have been permanently deleted.');
      logout();
      navigate('/');
    } catch (err) {
      console.error('Account deletion failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-navy-800 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy-by-Design Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
          Privacy Center & Data Sovereignty
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your personal data processing, configurable retention horizons, and GDPR/DPDP export rights.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Preferences Form */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-navy-900 dark:text-white pb-3 border-b border-slate-100 dark:border-navy-800">
          Consent & Retention Policies
        </h2>

        <form onSubmit={handleSavePreferences} className="space-y-6">
          {/* Data retention toggle */}
          <div className="flex items-start justify-between space-x-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-navy-900 dark:text-white block">
                Store Consultation History
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Retain questions and cited responses in your private account so you can revisit past inquiries.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentRetention}
              onChange={(e) => setConsentRetention(e.target.checked)}
              className="w-5 h-5 accent-gold-500 rounded cursor-pointer mt-1"
            />
          </div>

          {/* Retention Period Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
            <div>
              <label className="text-sm font-bold text-navy-900 dark:text-white block">
                Automatic Data Expiry Period
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inquiries older than this limit are flagged for automatic scheduled purging.
              </p>
            </div>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white text-xs font-semibold outline-none focus:border-gold-500"
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days (Recommended)</option>
              <option value={180}>180 Days</option>
              <option value={365}>1 Year</option>
            </select>
          </div>

          {/* Personalization toggle */}
          <div className="flex items-start justify-between space-x-4 pt-2 border-t border-slate-100 dark:border-navy-800">
            <div className="space-y-1">
              <label className="text-sm font-bold text-navy-900 dark:text-white block">
                Personalized Jurisdiction Context
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Allow the chatbot to tailor responses based on your stated state/territory jurisdiction in India.
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentPersonalization}
              onChange={(e) => setConsentPersonalization(e.target.checked)}
              className="w-5 h-5 accent-gold-500 rounded cursor-pointer mt-1"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 hover:bg-navy-800 dark:hover:bg-gold-600 text-white dark:text-navy-950 font-bold text-xs shadow transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Update Privacy Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Data Export & Erase Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">
            Export My Personal Data (JSON)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Download a portable, machine-readable JSON copy of your profile, all conversations, citations, and generated document drafts.
          </p>
          <button
            onClick={handleExportData}
            className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-800 text-xs font-bold text-navy-900 dark:text-white transition flex items-center justify-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Data Archive</span>
          </button>
        </div>

        {/* Clear Chat History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">
            Clear Chat History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Immediately delete all chat conversations, messages, and associated citations while keeping your account and drafts intact.
          </p>
          <button
            onClick={handleClearHistory}
            className="w-full py-2.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950/40 transition flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Conversations</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-4">
        <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: Permanent Account Erasure (Right to be Forgotten)</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Permanently delete your account, authentication credentials, conversation history, and saved drafts. 
          This operation is irreversible and fully purges all records from the database.
        </p>

        {deleteConfirmOpen ? (
          <div className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-rose-300 dark:border-rose-800 space-y-3">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              Confirm Permanent Erasure: Are you absolutely sure?
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition"
              >
                Yes, Permanently Delete My Account
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition flex items-center space-x-2"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Delete My Account & Personal Data</span>
          </button>
        )}
      </div>
    </div>
  );
};
