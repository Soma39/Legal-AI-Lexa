import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Scale, MessageSquare, FileText, Share2, Shield, Search, 
  ArrowRight, Clock, Plus, ExternalLink, AlertCircle, Sparkles, 
  ChevronRight, BookmarkCheck, FileDown, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Conversation, GeneratedDocument } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [drafts, setDrafts] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [convRes, draftRes] = await Promise.all([
        api.get<Conversation[]>('/chat/conversations'),
        api.get<GeneratedDocument[]>('/documents/drafts'),
      ]);
      setConversations(convRes.data.slice(0, 5));
      setDrafts(draftRes.data.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Create new conversation and navigate to chat with inquiry
    try {
      const res = await api.post<Conversation>('/chat/conversations', {
        title: searchQuery.trim().slice(0, 45),
        topic: 'General Law',
        jurisdiction: 'India',
      });
      navigate(`/chat?id=${res.data.id}&initialQuery=${encodeURIComponent(searchQuery.trim())}`);
    } catch (err) {
      console.error(err);
      navigate('/chat');
    }
  };

  const topicCategories = [
    { title: "Consumer Rights", statute: "Consumer Protection Act, 2019", desc: "Product defect, unfair trade practice, refund remedies, e-Daakhil filing." },
    { title: "Property and Rental Matters", statute: "Transfer of Property Act, 1882", desc: "Lease drafting, eviction notice, security deposits, 11-month agreements." },
    { title: "Employment", statute: "Industrial Disputes Act & Wage Codes", desc: "Appointment letters, notice period, retrenchment severance, non-compete clauses." },
    { title: "Contract Law", statute: "Indian Contract Act, 1872", desc: "Agreement essentials, breach of contract, liquidated damages under Section 73." },
    { title: "Cybercrime and Online Fraud", statute: "Information Technology Act, 2000", desc: "Identity theft (Sec 66C), online cheating (Sec 66D), National Helpline 1930." },
    { title: "Criminal Law Information", statute: "Bharatiya Nyaya Sanhita (BNS) 2023", desc: "FIR & Zero FIR (BNSS 173), cheating (BNS 318), anticipatory bail (BNSS 482)." },
    { title: "Civil Disputes", statute: "Code of Civil Procedure, 1908", desc: "Legal demand notices, sworn affidavits, recovery suits, mediation procedures." },
    { title: "Company and Business Law", statute: "Companies Act, 2013", desc: "Director liabilities, freelancer service agreements, corporate compliance." },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Search Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950 text-white shadow-xl relative overflow-hidden border border-navy-700">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-navy-800/80 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Indian Jurisdiction Legal Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed font-light">
            Search Indian statutory law, launch conversational RAG consultations, or generate verified document drafts.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative flex items-center pt-2">
            <div className="absolute left-3.5 text-slate-400">
              <Search className="w-5 h-5 text-gold-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask any legal question to start a new cited consultation..."
              className="w-full pl-11 pr-36 py-3 rounded-xl bg-navy-950/90 text-white placeholder:text-slate-400 border border-slate-600 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 outline-none text-sm transition"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="absolute right-1.5 px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs shadow transition disabled:opacity-50 shrink-0"
            >
              Consult AI
            </button>
          </form>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          to="/chat"
          className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-gold-400 dark:hover:border-gold-500 hover:shadow transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-gold-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">New Legal Chat</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ask questions with cited statutes</p>
        </Link>

        <Link
          to="/drafting"
          className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-gold-400 dark:hover:border-gold-500 hover:shadow transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-gold-100 dark:bg-gold-950/40 text-gold-700 dark:text-gold-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">Draft Document</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rental, notice, complaint, affidavit</p>
        </Link>

        <Link
          to="/knowledge-graph"
          className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-gold-400 dark:hover:border-gold-500 hover:shadow transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">Knowledge Graph</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Trace Act & Section connections</p>
        </Link>

        <Link
          to="/privacy"
          className="p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-gold-400 dark:hover:border-gold-500 hover:shadow transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-navy-900 dark:text-white">Privacy Controls</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Export data & manage retention</p>
        </Link>
      </div>

      {/* Main Grid: Recent Conversations & Recently Generated Drafts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-gold-500" />
              <h2 className="font-bold text-sm text-navy-900 dark:text-white uppercase tracking-wider">
                Recent Inquiries
              </h2>
            </div>
            <Link to="/chat" className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              <div className="h-10 bg-slate-100 dark:bg-navy-800 rounded-lg animate-pulse"></div>
              <div className="h-10 bg-slate-100 dark:bg-navy-800 rounded-lg animate-pulse"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No conversations yet.</p>
              <Link
                to="/chat"
                className="inline-block text-xs font-bold text-navy-900 dark:text-gold-400 hover:underline"
              >
                Start your first inquiry &rarr;
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-800">
              {conversations.map((c) => (
                <Link
                  key={c.id}
                  to={`/chat?id=${c.id}`}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-800/50 px-2 rounded-lg transition"
                >
                  <div className="space-y-1 pr-4">
                    <span className="font-medium text-sm text-navy-900 dark:text-slate-200 line-clamp-1">
                      {c.title}
                    </span>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 font-medium">
                        {c.topic}
                      </span>
                      <span>•</span>
                      <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recently Generated Drafts */}
        <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gold-500" />
              <h2 className="font-bold text-sm text-navy-900 dark:text-white uppercase tracking-wider">
                Saved Document Drafts
              </h2>
            </div>
            <Link to="/drafting" className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline">
              New Draft
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              <div className="h-10 bg-slate-100 dark:bg-navy-800 rounded-lg animate-pulse"></div>
              <div className="h-10 bg-slate-100 dark:bg-navy-800 rounded-lg animate-pulse"></div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">No document drafts created yet.</p>
              <Link
                to="/drafting"
                className="inline-block text-xs font-bold text-navy-900 dark:text-gold-400 hover:underline"
              >
                Create your first draft &rarr;
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-800">
              {drafts.map((d) => (
                <div
                  key={d.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-800/50 px-2 rounded-lg transition"
                >
                  <div className="space-y-1 pr-4">
                    <span className="font-medium text-sm text-navy-900 dark:text-slate-200 line-clamp-1">
                      {d.title}
                    </span>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-gold-50 dark:bg-gold-950/40 text-gold-700 dark:text-gold-400 font-medium">
                        {d.document_type}
                      </span>
                      <span>•</span>
                      <span>{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`/api/v1/documents/drafts/${d.id}/download/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition"
                      title="Download PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </a>
                    <Link
                      to={`/drafting?editId=${d.id}`}
                      className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Suggested Legal Topic Categories */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">
              Indian Legal Categories & Statutory Context
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Informational categories based on codified Indian legislative acts. Legal rights depend on specific facts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topicCategories.map((t, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gold-600 dark:text-gold-400 block">
                  {t.statute}
                </span>
                <h3 className="font-bold text-sm text-navy-900 dark:text-white">{t.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.desc}
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery(`What are the key legal rules regarding ${t.title}?`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800 text-xs font-semibold text-navy-900 dark:text-gold-400 hover:underline flex items-center justify-between"
              >
                <span>Ask about this topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
