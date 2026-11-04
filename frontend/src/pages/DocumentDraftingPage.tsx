import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, Download, Check, AlertTriangle, Eye, Edit3, 
  Trash2, Plus, ArrowRight, ShieldAlert, Sparkles, FileDown, 
  Save, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { DocumentTemplate, GeneratedDocument } from '../types';

export const DocumentDraftingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('editId');

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [draftTitle, setDraftTitle] = useState('');
  
  // Saved drafts
  const [savedDrafts, setSavedDrafts] = useState<GeneratedDocument[]>([]);
  const [currentDraft, setCurrentDraft] = useState<GeneratedDocument | null>(null);
  const [editableContent, setEditableContent] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'wizard' | 'preview' | 'drafts'>('wizard');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplatesAndDrafts();
  }, []);

  useEffect(() => {
    if (editId) {
      loadDraftForEditing(editId);
    }
  }, [editId]);

  const fetchTemplatesAndDrafts = async () => {
    try {
      setLoading(true);
      const [tRes, dRes] = await Promise.all([
        api.get<DocumentTemplate[]>('/documents/templates'),
        api.get<GeneratedDocument[]>('/documents/drafts'),
      ]);
      setTemplates(tRes.data);
      if (tRes.data.length > 0 && !selectedTemplate) {
        selectTemplate(tRes.data[0]);
      }
      setSavedDrafts(dRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (t: DocumentTemplate) => {
    setSelectedTemplate(t);
    setDraftTitle(`${t.name} Draft`);
    // Initialize default values
    const defaults: Record<string, any> = {};
    const fields = t.form_schema?.fields || t.schema_json?.fields || [];
    fields.forEach((f) => {
      if (f.default !== undefined) {
        defaults[f.name] = f.default;
      }
    });
    setFormData(defaults);
    setCurrentDraft(null);
    setEditableContent('');
    setActiveTab('wizard');
  };

  const loadDraftForEditing = async (draftId: string) => {
    try {
      const res = await api.get<GeneratedDocument>(`/documents/drafts/${draftId}`);
      setCurrentDraft(res.data);
      setDraftTitle(res.data.title);
      setEditableContent(res.data.generated_content);
      setActiveTab('preview');
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setGenerating(true);
    try {
      const res = await api.post<GeneratedDocument>('/documents/drafts', {
        template_code: selectedTemplate.code,
        title: draftTitle.trim() || selectedTemplate.name,
        input_data: formData,
      });
      setCurrentDraft(res.data);
      setEditableContent(res.data.generated_content);
      setSavedDrafts((prev) => [res.data, ...prev]);
      setActiveTab('preview');
      setSuccessMessage('Draft generated successfully! You can preview, edit text inline, or download below.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error generating draft:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!currentDraft) return;
    try {
      const res = await api.put<GeneratedDocument>(`/documents/drafts/${currentDraft.id}`, {
        title: draftTitle,
        generated_content: editableContent,
      });
      setCurrentDraft(res.data);
      setSavedDrafts((prev) => prev.map((d) => (d.id === res.data.id ? res.data : d)));
      setSuccessMessage('Changes saved and document files regenerated.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await api.delete(`/documents/drafts/${draftId}`);
      setSavedDrafts((prev) => prev.filter((d) => d.id !== draftId));
      if (currentDraft?.id === draftId) {
        setCurrentDraft(null);
        setActiveTab('wizard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fields = selectedTemplate?.form_schema?.fields || selectedTemplate?.schema_json?.fields || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-50 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-500/30 text-gold-700 dark:text-gold-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated Legal Drafting Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
            Document Drafting Wizard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate standardized Indian legal agreements, notices, and affidavits with full transparency.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-navy-900 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'wizard'
                ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-gold-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Draft</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            disabled={!currentDraft}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-gold-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview & Edit</span>
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'drafts'
                ? 'bg-white dark:bg-navy-800 text-navy-900 dark:text-gold-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Saved Drafts ({savedDrafts.length})</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Content Areas */}
      {activeTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Selection Column */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Legal Template
            </h3>
            <div className="space-y-2">
              {templates.map((t) => {
                const isSelected = selectedTemplate?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`p-4 rounded-xl border cursor-pointer transition text-left space-y-1 ${
                      isSelected
                        ? 'bg-navy-50 dark:bg-navy-900 border-gold-500 text-navy-950 dark:text-white shadow-sm'
                        : 'bg-white dark:bg-navy-900/60 border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-navy-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 block">
                      {t.category}
                    </span>
                    <h4 className="font-bold text-sm">{t.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {t.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Fields Column */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTemplate && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-6">
                {/* Purpose & Limitations Notice */}
                <div className="p-4 rounded-xl bg-gold-50 dark:bg-navy-950 border border-gold-300 dark:border-gold-500/30 text-xs text-gold-900 dark:text-gold-200 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-gold-800 dark:text-gold-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Template Scope & Limitations:</span>
                  </div>
                  <p className="leading-relaxed pl-6">
                    {selectedTemplate.purpose_and_limitations}
                  </p>
                </div>

                <form onSubmit={handleGenerateDraft} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Draft Document Title
                    </label>
                    <input
                      type="text"
                      required
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white text-sm focus:border-gold-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields.map((f) => (
                      <div key={f.name} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {f.label} {f.required && <span className="text-rose-500">*</span>}
                        </label>
                        {f.type === 'textarea' ? (
                          <textarea
                            required={f.required}
                            rows={3}
                            value={formData[f.name] || ''}
                            onChange={(e) => handleInputChange(f.name, e.target.value)}
                            placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white text-sm focus:border-gold-500 outline-none"
                          />
                        ) : (
                          <input
                            type={f.type}
                            required={f.required}
                            value={formData[f.name] || ''}
                            onChange={(e) => handleInputChange(f.name, e.target.value)}
                            placeholder={f.placeholder || ''}
                            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white text-sm focus:border-gold-500 outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 italic">
                      Do not input sensitive identifiers (Aadhaar, bank passwords).
                    </span>
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-6 py-2.5 rounded-xl bg-navy-900 dark:bg-gold-500 hover:bg-navy-800 dark:hover:bg-gold-600 text-white dark:text-navy-950 font-bold text-sm shadow-md transition flex items-center space-x-2 disabled:opacity-50"
                    >
                      {generating ? (
                        <div className="w-4 h-4 border-2 border-white dark:border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Generate & Preview Draft</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview & Edit Tab */}
      {activeTab === 'preview' && currentDraft && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
            <div>
              <h2 className="font-bold text-base text-navy-900 dark:text-white">{currentDraft.title}</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Type: {currentDraft.document_type} • Status: {currentDraft.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveEdits}
                className="px-3.5 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-white text-xs font-bold transition flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5 text-gold-400" />
                <span>Save Changes</span>
              </button>
              <a
                href={`/api/v1/documents/drafts/${currentDraft.id}/download/docx`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download DOCX</span>
              </a>
              <a
                href={`/api/v1/documents/drafts/${currentDraft.id}/download/pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-navy-950 text-xs font-bold transition flex items-center space-x-1.5 shadow"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          </div>

          {/* Editable Document Editor */}
          <div className="p-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-lg space-y-4 font-mono text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-navy-800 font-sans">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Interactive Document Draft (Editable Inline)
              </span>
              <span className="text-xs text-gold-600 dark:text-gold-400">
                Click text to modify before exporting
              </span>
            </div>
            <textarea
              rows={22}
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 leading-relaxed outline-none focus:border-gold-500 transition font-sans text-sm"
            />
          </div>
        </div>
      )}

      {/* Saved Drafts List Tab */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Your Saved Legal Drafts ({savedDrafts.length})
            </h3>
            <button
              onClick={() => setActiveTab('wizard')}
              className="px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs transition"
            >
              + Create New Draft
            </button>
          </div>

          {savedDrafts.length === 0 ? (
            <div className="text-center py-16 p-8 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No saved drafts yet</p>
              <p className="text-xs text-slate-500">Drafts generated via the wizard will appear here for editing and download.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedDrafts.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gold-600 dark:text-gold-400 block">
                      {d.document_type}
                    </span>
                    <h4 className="font-bold text-sm text-navy-900 dark:text-white line-clamp-1">{d.title}</h4>
                    <span className="text-[11px] text-slate-400 block">
                      Created: {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`/api/v1/documents/drafts/${d.id}/download/docx`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px]"
                      >
                        DOCX
                      </a>
                      <a
                        href={`/api/v1/documents/drafts/${d.id}/download/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-gold-50 dark:bg-gold-950/40 text-gold-700 dark:text-gold-400 font-semibold text-[11px]"
                      >
                        PDF
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadDraftForEditing(d.id)}
                        className="text-navy-900 dark:text-gold-400 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(d.id)}
                        className="text-rose-500 hover:text-rose-600 p-1"
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
