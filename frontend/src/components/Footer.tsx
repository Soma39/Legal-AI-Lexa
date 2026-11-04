import React from 'react';
import { Scale, ExternalLink, ShieldCheck, PhoneCall, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800 text-sm">
      {/* Official Emergency & Helplines Alert */}
      <div className="bg-navy-900/60 border-b border-navy-800/80 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2 text-gold-400">
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Verified Indian Citizen Support & Emergency Contacts:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span>National Emergency: <strong className="text-white">112</strong></span>
            <span>National Cyber Crime Helpline: <strong className="text-white">1930</strong> (<a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="underline hover:text-gold-400">cybercrime.gov.in</a>)</span>
            <span>National Consumer Helpline: <strong className="text-white">1915</strong> (<a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer" className="underline hover:text-gold-400">consumerhelpline.gov.in</a>)</span>
            <span>Women Helpline: <strong className="text-white">1091</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Platform & Jurisdiction */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gold-500 text-navy-950 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-white">LegalAI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-driven personalized legal assistance platform designed for the jurisdiction of India. 
              Synthesizing verified statutory provisions from the Bharatiya Nyaya Sanhita (BNS), 
              Consumer Protection Act, and official legislation.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gold-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Extensible Architecture • Privacy-by-Design</span>
            </div>
          </div>

          {/* Col 2: Authoritative Indian Portals */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Authoritative Legal Sources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://www.indiacode.nic.in/" target="_blank" rel="noreferrer" className="hover:text-gold-400 flex items-center space-x-1">
                  <span>India Code Legislative Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.sci.gov.in/" target="_blank" rel="noreferrer" className="hover:text-gold-400 flex items-center space-x-1">
                  <span>Supreme Court of India</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://ecourts.gov.in/" target="_blank" rel="noreferrer" className="hover:text-gold-400 flex items-center space-x-1">
                  <span>eCourts Services Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://edaakhil.nic.in/" target="_blank" rel="noreferrer" className="hover:text-gold-400 flex items-center space-x-1">
                  <span>e-Daakhil Consumer Filing</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Modules */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/chat" className="hover:text-gold-400">RAG Legal Chatbot</Link></li>
              <li><Link to="/drafting" className="hover:text-gold-400">Document Drafting Wizard</Link></li>
              <li><Link to="/knowledge-graph" className="hover:text-gold-400">Statutory Knowledge Graph</Link></li>
              <li><Link to="/privacy" className="hover:text-gold-400">Privacy & Data Governance</Link></li>
            </ul>
          </div>

          {/* Col 4: Statutory Legal Disclaimer */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Statutory Disclaimer</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-navy-900/50 p-3 rounded-lg border border-navy-800">
              LegalAI is an automated technological tool created for educational and informational purposes only. 
              The answers generated by this platform do not constitute legal advice, advocate-client relationship, 
              or a guarantee of outcome. Consult an enrolled advocate of the Bar Council of India for formal legal counsel.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-navy-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
          <div>
            &copy; 2026 LegalAI. Developed for B.Tech Capstone Project • Indian Law Jurisdiction.
          </div>
          <div className="flex space-x-4">
            <Link to="/privacy" className="hover:text-slate-400">Privacy Notice</Link>
            <span>•</span>
            <span>Terms of Educational Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
