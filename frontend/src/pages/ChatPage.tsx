import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Scale, Send, Plus, Trash2, Edit2, Check, X, Copy, 
  ExternalLink, Mic, MicOff, Volume2, VolumeX, ThumbsUp, 
  ThumbsDown, Search, Sparkles, BookOpen, AlertCircle, 
  ChevronRight, CornerDownLeft, ShieldAlert, Download, FileText
} from 'lucide-react';
import api from '../services/api';
import { Conversation, Message, SourceCitation } from '../types';

export const ChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConvId = searchParams.get('id');
  const initialQuery = searchParams.get('initialQuery');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Voice interaction states (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Feedback state
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of markdown asterisks for speech
    const cleanSpeech = text.replace(/[*#>`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get<Conversation[]>('/chat/conversations');
      setConversations(res.data);
      if (initialConvId) {
        loadConversation(initialConvId);
      } else if (res.data.length > 0 && !activeConv) {
        loadConversation(res.data[0].id);
      } else if (res.data.length === 0) {
        createNewChat();
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      setLoading(true);
      const res = await api.get<Conversation>(`/chat/conversations/${convId}`);
      setActiveConv(res.data);
      setMessages(res.data.messages || []);
      setSearchParams({ id: convId });

      // If initialQuery provided from dashboard search box
      if (initialQuery && res.data.messages?.length === 0) {
        setInputQuery(initialQuery);
        setSearchParams({ id: convId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await api.post<Conversation>('/chat/conversations', {
        title: 'New Legal Inquiry',
        topic: 'General Law',
        jurisdiction: 'India',
      });
      setConversations((prev) => [res.data, ...prev]);
      setActiveConv(res.data);
      setMessages([]);
      setSearchParams({ id: res.data.id });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || !activeConv || loading) return;

    const query = inputQuery.trim();
    setInputQuery('');

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      sender: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.post<Message>(`/chat/conversations/${activeConv.id}/messages`, {
        content: query,
        jurisdiction: activeConv.jurisdiction || 'India',
      });
      // Replace optimistic message or update messages list
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, res.data]);
      // Refresh conversation title if updated
      const convRes = await api.get<Conversation>(`/chat/conversations/${activeConv.id}`);
      setActiveConv(convRes.data);
      setConversations((prev) => prev.map((c) => (c.id === convRes.data.id ? convRes.data : c)));
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (convId: string) => {
    if (!newTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      const res = await api.put<Conversation>(`/chat/conversations/${convId}`, { title: newTitle.trim() });
      setConversations((prev) => prev.map((c) => (c.id === convId ? res.data : c)));
      if (activeConv?.id === convId) setActiveConv(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setEditingTitleId(null);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) return;
    try {
      await api.delete(`/chat/conversations/${convId}`);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConv?.id === convId) {
        if (remaining.length > 0) {
          loadConversation(remaining[0].id);
        } else {
          createNewChat();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, isHelpful: boolean, citationAccurate: boolean) => {
    try {
      await api.post('/feedback', {
        message_id: messageId,
        is_helpful: isHelpful,
        citation_accurate: citationAccurate,
      });
      setFeedbackSent((prev) => ({ ...prev, [messageId]: true }));
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  const exportChatTranscript = () => {
    if (!messages.length) return;
    let transcript = `# LegalAI Consultation Transcript\n\n`;
    transcript += `**Topic:** ${activeConv?.topic || 'General Law'}\n`;
    transcript += `**Jurisdiction:** ${activeConv?.jurisdiction || 'India'}\n`;
    transcript += `**Date:** ${new Date().toLocaleString()}\n\n`;
    transcript += `---\n\n`;

    messages.forEach((m) => {
      transcript += `### ${m.sender === 'user' ? '👤 Citizen Query' : '⚖️ LegalAI Analysis'}\n\n`;
      transcript += `${m.content}\n\n`;
      if (m.citations && m.citations.length > 0) {
        transcript += `**Verified Citations:**\n`;
        m.citations.forEach((c) => {
          transcript += `- **${c.statute_name}** (${c.section_or_article || 'Section'}) - [India Code](${c.source_url || 'https://www.indiacode.nic.in/'})\n`;
        });
        transcript += `\n`;
      }
      transcript += `---\n\n`;
    });

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LegalAI_Consultation_${(activeConv?.title || 'Chat').replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-slate-50 dark:bg-navy-950 overflow-hidden">
      {/* Sidebar: Conversation Threads */}
      <aside className="w-80 border-r border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-navy-800 space-y-3">
          <button
            onClick={createNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-navy-900 dark:bg-gold-500 hover:bg-navy-800 dark:hover:bg-gold-600 text-white dark:text-navy-950 font-bold text-xs shadow transition flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Legal Inquiry</span>
          </button>

          {/* Chat Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800/60 p-2 space-y-0.5">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConv?.id === c.id;
              const isEditing = editingTitleId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => !isEditing && loadConversation(c.id)}
                  className={`group relative p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs ${
                    isActive
                      ? 'bg-navy-50 text-navy-950 dark:bg-navy-800 dark:text-gold-300 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800/50'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {isEditing ? (
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full py-0.5 px-1.5 text-xs rounded border border-gold-500 bg-white dark:bg-navy-900 text-slate-900 dark:text-white outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(c.id);
                            if (e.key === 'Escape') setEditingTitleId(null);
                          }}
                        />
                        <button onClick={() => handleRename(c.id)} className="text-emerald-500 hover:text-emerald-600 p-1">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingTitleId(null)} className="text-slate-400 hover:text-slate-500 p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="block truncate">{c.title}</span>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5 font-normal">
                          <span>{c.topic}</span>
                          <span>•</span>
                          <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {!isEditing && (
                    <div className="hidden group-hover:flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingTitleId(c.id);
                          setNewTitle(c.title);
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(c.id)}
                        className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Informational Disclaimer badge */}
        <div className="p-3 bg-slate-50 dark:bg-navy-950 border-t border-slate-200 dark:border-navy-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-gold-500 shrink-0" />
          <span>India Law RAG Engine • BNS 2023 Compliant</span>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50 dark:bg-navy-950 overflow-hidden">
        {/* Active Chat Header */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-sm flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-navy-800 text-gold-400 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-navy-900 dark:text-white line-clamp-1">
                {activeConv?.title || 'Legal Consultation'}
              </h2>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-gold-600 dark:text-gold-400">
                  Topic: {activeConv?.topic || 'General Law'}
                </span>
                <span>•</span>
                <span>Jurisdiction: {activeConv?.jurisdiction || 'India'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <button
                onClick={exportChatTranscript}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                title="Export complete legal consultation as Markdown"
              >
                <Download className="w-3.5 h-3.5 text-gold-500" />
                <span className="hidden sm:inline">Export Transcript</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 text-gold-400 flex items-center justify-center shadow-lg">
                <Scale className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-navy-900 dark:text-white">
                How can LegalAI assist you today?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light max-w-lg">
                Ask specific questions regarding Indian statutory codes, lease agreements, consumer remedies, 
                cheque bounce cases, cybercrime, or criminal procedure. All answers are cited from official Indian legislation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-3 text-left">
                <button
                  onClick={() => setInputQuery("What is the difference between IPC 420 and BNS 318 for cheating?")}
                  className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 hover:border-gold-400 hover:shadow-sm transition"
                >
                  <span className="font-bold block text-navy-900 dark:text-white">BNS 318 vs IPC 420</span>
                  <span className="text-[11px] text-slate-400">Cheating, fraud & punishment under new codes</span>
                </button>
                <button
                  onClick={() => setInputQuery("How do I register a Zero FIR under BNSS Section 173?")}
                  className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 hover:border-gold-400 hover:shadow-sm transition"
                >
                  <span className="font-bold block text-navy-900 dark:text-white">Zero FIR & e-FIR (BNSS 173)</span>
                  <span className="text-[11px] text-slate-400">Jurisdiction-free reporting & 3-day signature rule</span>
                </button>
                <button
                  onClick={() => setInputQuery("What are the steps and notice timeline for cheque bounce under Section 138 NI Act?")}
                  className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 hover:border-gold-400 hover:shadow-sm transition"
                >
                  <span className="font-bold block text-navy-900 dark:text-white">Cheque Bounce (NI Act 138)</span>
                  <span className="text-[11px] text-slate-400">30-day notice, 15-day cure window & court filing</span>
                </button>
                <button
                  onClick={() => setInputQuery("What can a homebuyer do if a builder delays possession under Section 18 of RERA?")}
                  className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 hover:border-gold-400 hover:shadow-sm transition"
                >
                  <span className="font-bold block text-navy-900 dark:text-white">Delayed Flat Possession (RERA)</span>
                  <span className="text-[11px] text-slate-400">Statutory refund with interest under Section 18</span>
                </button>
                <button
                  onClick={() => setInputQuery("What notice period is mandatory under Section 106 of Transfer of Property Act?")}
                  className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 hover:border-gold-400 hover:shadow-sm transition"
                >
                  <span className="font-bold block text-navy-900 dark:text-white">Tenancy Notice Period (TPA 106)</span>
                  <span className="text-[11px] text-slate-400">15-day statutory residential lease notice</span>
                </button>
                <button
                  onClick={() => setInputQuery("What is the immediate procedure for online financial fraud and reporting to 1930?")}
                  className="p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs text-slate-700 dark:text-slate-300 hover:border-gold-400 hover:shadow-sm transition"
                >
                  <span className="font-bold block text-navy-900 dark:text-white">Cyber Fraud & Helpline 1930</span>
                  <span className="text-[11px] text-slate-400">Transaction freeze, IT Act & cybercrime.gov.in</span>
                </button>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';

              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl p-5 shadow-sm space-y-3 ${
                      isUser
                        ? 'bg-navy-900 text-white dark:bg-gold-500 dark:text-navy-950 font-medium text-sm'
                        : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800 text-xs">
                        <div className="flex items-center space-x-2 font-bold text-navy-900 dark:text-gold-400">
                          <Scale className="w-3.5 h-3.5" />
                          <span>LegalAI Assistant</span>
                          {m.confidence_score !== undefined && m.confidence_score !== null && (
                            <span className="ml-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                              {Math.round(m.confidence_score * 100)}% Grounded
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Audio TTS Button */}
                          <button
                            onClick={() => handleSpeak(m.content, m.id)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                            title={speakingMessageId === m.id ? 'Stop reading' : 'Read answer aloud'}
                          >
                            {speakingMessageId === m.id ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          {/* Copy Answer Button */}
                          <button
                            onClick={() => copyToClipboard(m.content, m.id)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                            title="Copy response"
                          >
                            {copiedId === m.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Answer content */}
                    <div className="text-sm leading-relaxed whitespace-pre-line prose dark:prose-invert max-w-none">
                      {m.content}
                    </div>

                    {/* Citations Card Section */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-gold-500" />
                            <span>Verified Citations ({m.citations.length})</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {m.citations.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 text-xs space-y-1"
                            >
                              <div className="flex items-start justify-between">
                                <span className="font-bold text-navy-900 dark:text-gold-400 block line-clamp-1">
                                  {c.statute_name}
                                </span>
                                {c.source_url && (
                                  <a
                                    href={c.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 p-0.5"
                                    title="View statute on India Code"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                              <span className="text-slate-600 dark:text-slate-300 font-semibold block">
                                {c.section_or_article}
                              </span>
                              {c.exact_quote && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                                  "{c.exact_quote}"
                                </p>
                              )}
                              <button
                                onClick={() => copyToClipboard(`${c.statute_name} (${c.section_or_article}): ${c.exact_quote || ''}`, c.id)}
                                className="text-[10px] text-gold-600 dark:text-gold-400 hover:underline pt-1 block"
                              >
                                {copiedId === c.id ? 'Copied Citation!' : 'Copy Citation'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disclaimer & Feedback */}
                    {!isUser && (
                      <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                        <span className="text-[10px] italic">
                          Generated for educational review. Always verify with an enrolled advocate.
                        </span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px]">Helpful?</span>
                          <button
                            onClick={() => handleFeedback(m.id, true, true)}
                            disabled={feedbackSent[m.id]}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 ${
                              feedbackSent[m.id] ? 'text-emerald-500' : 'text-slate-400'
                            }`}
                            title="Helpful & Accurate"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, false, false)}
                            disabled={feedbackSent[m.id]}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-400 hover:text-rose-500"
                            title="Inaccurate or Unhelpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                          {feedbackSent[m.id] && (
                            <span className="text-[10px] text-emerald-500 font-medium">Recorded!</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Retrieving verified Indian legal corpus & formulating cited explanation...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Box */}
        <div className="p-4 bg-white dark:bg-navy-900 border-t border-slate-200 dark:border-navy-800">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
            {/* Microphone button for Web Speech API */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-lg mr-2 transition ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-gold-400'
                }`}
                title={isListening ? 'Listening (click to stop)...' : 'Dictate question via voice'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to speech... Speak clearly in English.'
                  : 'Type your legal inquiry or citation lookup here...'
              }
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white text-sm focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="ml-2 px-4 py-3 rounded-xl bg-navy-900 dark:bg-gold-500 hover:bg-navy-800 dark:hover:bg-gold-600 text-white dark:text-navy-950 font-bold text-sm shadow transition disabled:opacity-50 flex items-center space-x-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
