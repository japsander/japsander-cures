import React from 'react';
import { IssueLog, IssueStatus, NcrStatus } from '../types';
import { X, Calendar, Factory, Hash, AlertTriangle, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface IssueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: IssueLog | null;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Issue Details
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Type</p>
              <p className="text-lg font-bold text-slate-800">{log.type}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-right md:text-left">Timestamp</p>
              <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Core Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plant & Project</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-medium">{log.plantNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold border border-slate-200">
                    Project: {log.project || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">References</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-medium">CC: {log.cureCycleNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold
                    ${log.status === IssueStatus.YES ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {log.status === IssueStatus.YES ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    NCR Raised: {log.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NCR Specific Details */}
          {log.status === IssueStatus.YES && (
            <div className="bg-red-50/50 rounded-xl border border-red-100 p-5 space-y-4">
              <h4 className="font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Non-Conformance Report Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">NCR Number</p>
                   <p className="text-base font-semibold text-slate-800">{log.ncrNumber || 'Pending Assignment'}</p>
                </div>
                <div>
                   <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">NCR Status</p>
                   <p className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                     log.ncrStatus === NcrStatus.CLOSED 
                       ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                       : 'bg-red-100 text-red-800 border-red-200'
                   }`}>
                     {log.ncrStatus || 'Open'}
                   </p>
                </div>
                {log.ncrRaisedTimestamp && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Date Raised</p>
                    <p className="text-sm text-slate-700">{new Date(log.ncrRaisedTimestamp).toLocaleDateString()}</p>
                  </div>
                )}
                {log.ncrResolution && (
                  <div className="md:col-span-2 mt-2 pt-2 border-t border-red-200">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Resolution</p>
                    <p className="text-sm font-semibold text-slate-800">{log.ncrResolution}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description / Notes</p>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {log.notes || "No additional notes provided."}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;