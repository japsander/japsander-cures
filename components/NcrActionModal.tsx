
import React, { useState, useEffect } from 'react';
import { IssueLog, NcrStatus, NcrResolution } from '../types';
import { X, Save, AlertTriangle, CheckCircle2, Trash2, Recycle, FileCheck } from 'lucide-react';

interface NcrActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: IssueLog | null;
  onUpdate: (id: string, updates: Partial<IssueLog>) => void;
}

const NcrActionModal: React.FC<NcrActionModalProps> = ({ 
  isOpen, 
  onClose, 
  log, 
  onUpdate 
}) => {
  const [notes, setNotes] = useState('');
  const [ncrNumber, setNcrNumber] = useState('');
  const [view, setView] = useState<'details' | 'close'>('details');
  
  useEffect(() => {
    if (log) {
      setNotes(log.notes || '');
      setNcrNumber(log.ncrNumber || '');
      setView('details');
    }
  }, [log, isOpen]);

  if (!isOpen || !log) return null;

  const handleUpdateDetails = () => {
    onUpdate(log.id, { 
      notes: notes,
      ncrNumber: ncrNumber 
    });
    onClose();
  };

  const handleCloseNcr = (resolution: NcrResolution) => {
    onUpdate(log.id, { 
      ncrStatus: NcrStatus.CLOSED,
      ncrResolution: resolution,
      // Optional: Save notes/number as well in case they were edited before clicking close
      notes: notes,
      ncrNumber: ncrNumber
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Manage Open NCR
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-red-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {view === 'details' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issue Type</span>
                   <p className="font-semibold text-slate-800">{log.type}</p>
                </div>
                <div className="text-right">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plant</span>
                   <p className="font-semibold text-slate-800">{log.plantNumber}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NCR Number</label>
                <input
                  type="text"
                  value={ncrNumber}
                  onChange={(e) => setNcrNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Details / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setView('close')}
                  className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Close NCR...
                </button>
                <button
                  onClick={handleUpdateDetails}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
               <div>
                 <h4 className="text-lg font-bold text-slate-800 mb-2">Close Non-Conformance Report</h4>
                 <p className="text-sm text-slate-500">
                   Please select the resolution method used to close this NCR. This action will mark the NCR as closed.
                 </p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                 <button
                   onClick={() => handleCloseNcr(NcrResolution.USE_AS_IS)}
                   className="flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all text-left group"
                 >
                   <div className="bg-blue-200 p-2 rounded-lg group-hover:bg-white transition-colors">
                     <FileCheck className="w-6 h-6 text-blue-700" />
                   </div>
                   <div>
                     <span className="block font-bold text-blue-900">Use As-Is</span>
                     <span className="text-xs text-blue-700">Accept deviations, functional integrity intact.</span>
                   </div>
                 </button>

                 <button
                   onClick={() => handleCloseNcr(NcrResolution.REWORK)}
                   className="flex items-center gap-3 p-4 border border-amber-200 bg-amber-50 rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-all text-left group"
                 >
                   <div className="bg-amber-200 p-2 rounded-lg group-hover:bg-white transition-colors">
                     <Recycle className="w-6 h-6 text-amber-700" />
                   </div>
                   <div>
                     <span className="block font-bold text-amber-900">Rework / Repair</span>
                     <span className="text-xs text-amber-700">Additional processing to meet specifications.</span>
                   </div>
                 </button>

                 <button
                   onClick={() => handleCloseNcr(NcrResolution.SCRAP)}
                   className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all text-left group"
                 >
                   <div className="bg-red-200 p-2 rounded-lg group-hover:bg-white transition-colors">
                     <Trash2 className="w-6 h-6 text-red-700" />
                   </div>
                   <div>
                     <span className="block font-bold text-red-900">Scrap</span>
                     <span className="text-xs text-red-700">Material cannot be used. Discard and replace.</span>
                   </div>
                 </button>
               </div>

               <button
                  onClick={() => setView('details')}
                  className="text-sm text-slate-500 hover:text-slate-800 underline"
               >
                 Go Back to Details
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NcrActionModal;
