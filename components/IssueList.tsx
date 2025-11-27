import React, { useState, useMemo, useEffect } from 'react';
import { IssueLog, IssueStatus, OptionItem, NcrStatus, NcrResolution } from '../types';
import { Hash, FileText, Filter, AlertTriangle, Pencil, Check, X, Calendar, Share2, CheckCircle2, LockOpen, Recycle, Trash2 } from 'lucide-react';
import { STATUS_OPTIONS } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import IssueDetailModal from './IssueDetailModal';

interface IssueListFilters {
  type?: string;
  status?: string;
  plant?: string;
  project?: string;
  timeRange?: string;
  resolution?: string;
  ncrStatus?: string;
}

interface IssueListProps {
  logs: IssueLog[];
  onUpdateLog: (id: string, updates: Partial<IssueLog>) => void;
  onDeleteLog: (id: string) => void;
  onEditLog: (log: IssueLog) => void;
  onShareLog: (log: IssueLog) => void;
  initialFilters?: IssueListFilters;
  issueOptions: OptionItem[];
  plantOptions: OptionItem[];
  projectOptions: OptionItem[];
}

// New Resolution Modal component, self-contained for simplicity
const NcrResolutionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resolution: NcrResolution) => void;
  log: IssueLog | null;
}> = ({ isOpen, onClose, onConfirm, log }) => {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Close NCR: {log.ncrNumber || 'Pending'}</h3>
          <p className="text-sm text-slate-500 mt-1">Please select the final resolution for this issue.</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onConfirm(NcrResolution.USE_AS_IS)}
            className="w-full flex items-center gap-3 p-4 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all text-left group"
          >
            <div className="bg-blue-200 p-2 rounded-lg group-hover:bg-white transition-colors">
              <CheckCircle2 className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <span className="block font-bold text-blue-900">Use As-Is</span>
              <span className="text-xs text-blue-700">Accept deviations, part is functional.</span>
            </div>
          </button>

          <button
            onClick={() => onConfirm(NcrResolution.REWORK)}
            className="w-full flex items-center gap-3 p-4 border border-amber-200 bg-amber-50 rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-all text-left group"
          >
            <div className="bg-amber-200 p-2 rounded-lg group-hover:bg-white transition-colors">
              <Recycle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <span className="block font-bold text-amber-900">Rework / Repair</span>
              <span className="text-xs text-amber-700">Apply additional processing to meet spec.</span>
            </div>
          </button>

          <button
            onClick={() => onConfirm(NcrResolution.SCRAP)}
            className="w-full flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all text-left group"
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
          onClick={onClose}
          className="w-full mt-6 py-2 text-sm text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};


const IssueList: React.FC<IssueListProps> = ({ 
  logs, 
  onUpdateLog, 
  onDeleteLog,
  onEditLog,
  onShareLog,
  initialFilters, 
  issueOptions, 
  plantOptions, 
  projectOptions 
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [filterPlant, setFilterPlant] = useState<string>('All');
  const [filterProject, setFilterProject] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterTimeRange, setFilterTimeRange] = useState<string>('all');
  const [filterResolution, setFilterResolution] = useState<string>('All');
  const [filterNcrStatus, setFilterNcrStatus] = useState<string>('All');

  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineNcrValue, setInlineNcrValue] = useState<string>('');
  
  // State for re-opening an NCR
  const [reopenConfirmation, setReopenConfirmation] = useState<{ isOpen: boolean; log: IssueLog | null }>({
    isOpen: false,
    log: null
  });

  // State for closing an NCR with resolution
  const [resolutionModal, setResolutionModal] = useState<{ isOpen: boolean; log: IssueLog | null }>({
    isOpen: false,
    log: null,
  });

  const [viewLog, setViewLog] = useState<IssueLog | null>(null);

  useEffect(() => {
    if (initialFilters) {
      setFilterType(initialFilters.type || 'All');
      setFilterStatus(initialFilters.status || 'All');
      setFilterPlant(initialFilters.plant || 'All');
      setFilterProject(initialFilters.project || 'All');
      setFilterTimeRange(initialFilters.timeRange || 'all');
      setFilterResolution(initialFilters.resolution || 'All');
      setFilterNcrStatus(initialFilters.ncrStatus || 'All');
    } else {
      setFilterType('All');
      setFilterStatus('All');
      setFilterPlant('All');
      setFilterProject('All');
      setFilterTimeRange('all');
      setFilterResolution('All');
      setFilterNcrStatus('All');
    }
  }, [initialFilters]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesType = filterType === 'All' || log.type === filterType;
      const matchesPlant = filterPlant === 'All' || log.plantNumber === filterPlant;
      const matchesProject = filterProject === 'All' || (log.project || 'N/A') === filterProject;
      const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
      const matchesResolution = filterResolution === 'All' || log.ncrResolution === filterResolution;
      const matchesNcrStatus = filterNcrStatus === 'All' || log.ncrStatus === filterNcrStatus;

      const matchesTime = (() => {
        if (filterTimeRange === 'all') return true;
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        if (filterTimeRange === 'week') {
           const day = start.getDay();
           const diff = start.getDate() - day + (day === 0 ? -6 : 1);
           start.setDate(diff);
        } else if (filterTimeRange === 'month') {
           start.setDate(1);
        } else if (filterTimeRange === 'year') {
           start.setMonth(0, 1);
        }
        return logDate >= start;
      })();

      return matchesType && matchesPlant && matchesStatus && matchesProject && matchesTime && matchesResolution && matchesNcrStatus;
    });
  }, [logs, filterType, filterPlant, filterProject, filterStatus, filterTimeRange, filterResolution, filterNcrStatus]);

  const startInlineEditing = (log: IssueLog) => {
    setInlineEditingId(log.id);
    setInlineNcrValue(log.ncrNumber || '');
  };

  const saveInlineEdit = (id: string) => {
    const updates: Partial<IssueLog> = { ncrNumber: inlineNcrValue };
    if (inlineNcrValue && inlineNcrValue.trim() !== '') {
       updates.status = IssueStatus.YES;
    }
    onUpdateLog(id, updates);
    setInlineEditingId(null);
    setInlineNcrValue('');
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineNcrValue('');
  };

  // Determines which modal to open
  const requestNcrToggle = (log: IssueLog) => {
    if (log.ncrStatus === NcrStatus.CLOSED) {
      setReopenConfirmation({ isOpen: true, log });
    } else {
      setResolutionModal({ isOpen: true, log });
    }
  };

  // Handles closing an NCR with a selected resolution
  const executeNcrClose = (resolution: NcrResolution) => {
    if (resolutionModal.log) {
      onUpdateLog(resolutionModal.log.id, { 
        ncrStatus: NcrStatus.CLOSED,
        ncrResolution: resolution
      });
    }
    setResolutionModal({ isOpen: false, log: null });
  };

  // Handles re-opening a closed NCR
  const executeNcrReopen = () => {
    if (reopenConfirmation.log) {
      onUpdateLog(reopenConfirmation.log.id, { 
        ncrStatus: NcrStatus.OPEN,
        ncrResolution: undefined // Clear resolution on re-open
      });
    }
    setReopenConfirmation({ isOpen: false, log: null });
  };


  if (logs.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-800">No records found</h3>
        <p className="text-slate-500 mt-1">Start by logging a new cure issue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-sm uppercase tracking-wide">Filters</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
             <label className="text-sm text-slate-500">Period:</label>
             <select 
               value={filterTimeRange}
               onChange={(e) => setFilterTimeRange(e.target.value)}
               className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="all">All Time</option>
               <option value="week">This Week</option>
               <option value="month">This Month</option>
               <option value="year">This Year</option>
             </select>
          </div>

          <div className="flex items-center gap-2">
             <label className="text-sm text-slate-500">Type:</label>
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px]"
             >
               <option value="All">All Types</option>
               {issueOptions.map(opt => (
                 <option key={opt.value} value={opt.value}>{opt.label}</option>
               ))}
               {filterType !== 'All' && !issueOptions.some(opt => opt.value === filterType) && (
                 <option value={filterType}>{filterType}</option>
               )}
             </select>
          </div>

          <div className="flex items-center gap-2">
             <label className="text-sm text-slate-500">Plant #:</label>
             <select 
               value={filterPlant}
               onChange={(e) => setFilterPlant(e.target.value)}
               className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="All">All Plants</option>
               {plantOptions.map(opt => (
                 <option key={opt.value} value={opt.value}>{opt.label}</option>
               ))}
             </select>
          </div>

          <div className="flex items-center gap-2">
             <label className="text-sm text-slate-500">Project:</label>
             <select 
               value={filterProject}
               onChange={(e) => setFilterProject(e.target.value)}
               className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="All">All Projects</option>
               {projectOptions.map(opt => (
                 <option key={opt.value} value={opt.value}>{opt.label}</option>
               ))}
             </select>
          </div>

          <div className="flex items-center gap-2">
             <label className="text-sm text-slate-500">NCR?:</label>
             <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="All">All</option>
               {STATUS_OPTIONS.map(opt => (
                 <option key={opt.value} value={opt.value}>{opt.label}</option>
               ))}
             </select>
          </div>

          {filterStatus !== 'No' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">NCR Status:</label>
              <select 
                value={filterNcrStatus}
                onChange={(e) => setFilterNcrStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value={NcrStatus.OPEN}>Open</option>
                <option value={NcrStatus.CLOSED}>Closed</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
             <label className="text-sm text-slate-500">Resolution:</label>
             <select 
               value={filterResolution}
               onChange={(e) => setFilterResolution(e.target.value)}
               className="bg-slate-50 border border-slate-200 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="All">All</option>
               {Object.values(NcrResolution).map(res => (
                 <option key={res} value={res}>{res}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Issue Logs</h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
            {filteredLogs.length} / {logs.length} Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Plant Number</th>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">NCR Raised?</th>
                <th className="px-6 py-3">Cure Cycle #</th>
                <th className="px-6 py-3">NCR #</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Time</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400 italic">
                    No issues match your current filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const issueColor = issueOptions.find(opt => opt.value === log.type)?.color || '#94a3b8';
                  const isInlineEditing = inlineEditingId === log.id;

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setViewLog(log)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: issueColor }}></div>
                          <span className="font-medium text-slate-800">{log.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">
                          {log.plantNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">
                          {log.project || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${log.status === IssueStatus.YES ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Hash className="w-3.5 h-3.5" />
                          {log.cureCycleNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {isInlineEditing ? (
                          <div className="flex items-center gap-1">
                            <input 
                              type="text"
                              value={inlineNcrValue}
                              onChange={(e) => setInlineNcrValue(e.target.value)}
                              className="w-28 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button onClick={() => saveInlineEdit(log.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={cancelInlineEdit} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                             {/* NCR Number Display */}
                             <div className="flex items-center gap-2 group-hover:bg-slate-100/50 p-1 rounded -ml-1 w-fit">
                                {log.ncrNumber ? (
                                    <div className="flex items-center gap-1.5 text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded w-fit text-xs">
                                        <AlertTriangle className="w-3 h-3" />
                                        {log.ncrNumber}
                                    </div>
                                ) : (
                                    <span className="text-slate-300 px-2">-</span>
                                )}
                                <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startInlineEditing(log);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-all"
                                    title="Quick Edit NCR Number"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                             </div>

                             {/* Toggle Status Button (Only if NCR exists) */}
                             {log.status === IssueStatus.YES && (
                                <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestNcrToggle(log);
                                    }}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border transition-all w-fit
                                        ${log.ncrStatus === NcrStatus.CLOSED 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                        }`}
                                    title="Click to toggle NCR Status"
                                >
                                    {log.ncrStatus === NcrStatus.CLOSED ? (
                                        <>
                                            <CheckCircle2 className="w-3 h-3" /> Closed
                                        </>
                                    ) : (
                                        <>
                                            <LockOpen className="w-3 h-3" /> Open
                                        </>
                                    )}
                                </button>
                             )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={log.notes}>
                        {log.notes || <span className="text-slate-400 italic">No notes</span>}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-slate-400 text-xs">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onShareLog(log)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Share / Export Record"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditLog(log)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Full Record"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={reopenConfirmation.isOpen}
        onClose={() => setReopenConfirmation({ isOpen: false, log: null })}
        onConfirm={executeNcrReopen}
        title="Re-open NCR?"
        message={`Are you sure you want to re-open ${reopenConfirmation.log?.ncrNumber || 'this NCR'}? Its previous resolution will be cleared.`}
        confirmText="Yes, Re-open"
      />

      <NcrResolutionModal
        isOpen={resolutionModal.isOpen}
        onClose={() => setResolutionModal({ isOpen: false, log: null })}
        onConfirm={executeNcrClose}
        log={resolutionModal.log}
      />

      <IssueDetailModal
        isOpen={!!viewLog}
        onClose={() => setViewLog(null)}
        log={viewLog}
      />
    </div>
  );
};

export default IssueList;