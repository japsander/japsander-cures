import React, { useState } from 'react';
import { IssueLog } from '../types';
import { X, Save, Calendar, Factory, AlertTriangle, Check } from 'lucide-react';

interface NcrMissingModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: IssueLog[];
  onUpdateLog: (id: string, updates: Partial<IssueLog>) => void;
}

const NcrMissingModal: React.FC<NcrMissingModalProps> = ({ 
  isOpen, 
  onClose, 
  logs, 
  onUpdateLog 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Pending NCR Assignments
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-red-100 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-sm text-slate-600">
            The following records have <strong>NCR Raised</strong> set to "Yes" but are missing an NCR Number. 
            Please enter the numbers below to update the records.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 flex flex-col items-center">
              <Check className="w-12 h-12 text-emerald-400 mb-2" />
              <p className="font-medium">All clear!</p>
              <p className="text-sm">No missing NCR numbers found.</p>
            </div>
          ) : (
            logs.map((log) => (
              <NcrRowItem key={log.id} log={log} onUpdate={onUpdateLog} />
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
           <button
             onClick={onClose}
             className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

const NcrRowItem: React.FC<{ log: IssueLog, onUpdate: (id: string, updates: Partial<IssueLog>) => void }> = ({ log, onUpdate }) => {
  const [value, setValue] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!value.trim()) return;
    onUpdate(log.id, { ncrNumber: value.trim() });
    setIsSaved(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (isSaved) return null; // Remove from list immediately upon save for better UX flow

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-300 transition-colors">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
           <span className="flex items-center gap-1">
             <Calendar className="w-3 h-3" />
             {new Date(log.timestamp).toLocaleDateString()}
           </span>
           <span>•</span>
           <span className="flex items-center gap-1">
             <Factory className="w-3 h-3" />
             {log.plantNumber}
           </span>
        </div>
        <div className="font-medium text-slate-800">{log.type}</div>
        <div className="text-xs text-slate-500 truncate max-w-md">{log.notes || "No notes"}</div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">#</span>
            <input 
                type="text" 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="NCR Number"
                className="w-full sm:w-48 pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
            />
        </div>
        <button 
            onClick={handleSave}
            disabled={!value.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Save NCR Number"
        >
            <Save className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NcrMissingModal;