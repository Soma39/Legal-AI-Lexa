import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-navy-900 text-gold-200 text-xs px-4 py-2 border-b border-gold-500/20 flex items-center justify-between">
      <div className="max-w-7xl mx-auto flex items-center space-x-2 text-center md:text-left">
        <ShieldAlert className="w-4 h-4 text-gold-400 shrink-0" />
        <span>
          <strong className="text-white">Educational & Informational Notice:</strong> LegalAI provides AI-assisted statutory information for the jurisdiction of <strong>India</strong>. It does not replace a licensed advocate and does not provide formal legal representation.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-white p-1 ml-2 transition"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
