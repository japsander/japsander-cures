import React, { useState, useEffect } from 'react';
import { IssueLog, IssueStatus, OptionItem, NcrStatus } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { PlusCircle, Save, Settings, Pencil, Trash2 } from 'lucide-react';
import OptionsModal from './OptionsModal';

interface IssueFormProps {
  onSubmit: (issue: Omit<IssueLog, 'id'>) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  initialData?: IssueLog;
  issueOptions: OptionItem[];
  plantOptions: OptionItem[];
  projectOptions: OptionItem[];
  setIssueOptions: React.Dispatch<React.SetStateAction<OptionItem[]>>;
  setPlantOptions: React.Dispatch<React.SetStateAction<OptionItem[]>>;
  setProjectOptions: React.Dispatch<React.SetStateAction<OptionItem[]>>;
}

const IssueForm: React.FC<IssueFormProps> = ({ 
  onSubmit, onCancel, onDelete, initialData, issueOptions, plantOptions, projectOptions, 
  setIssueOptions, setPlantOptions, setProjectOptions 
}) => {
  const [type, setType] = useState<string>('');
  const [plantNumber, setPlantNumber] = useState<string>('');
  const [project, setProject] = useState<string>('');
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.NO);
  const [cureCycleNumber, setCureCycleNumber] = useState('');
  const [ncrNumber, setNcrNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState('');
  
  // NCR specific state
  const [ncrRaisedTimestamp, setNcrRaisedTimestamp] = useState('');
  const [ncrStatus, setNcrStatus] = useState<NcrStatus>(NcrStatus.OPEN);

  // Modal State
  const [activeModal, setActiveModal] = useState<'issues' | 'plants' | 'projects' | null>(null);

  // Helper to format date for date input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize fields
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setPlantNumber(initialData.plantNumber);
      setProject(initialData.project);
      setStatus(initialData.status);
      setCureCycleNumber(initialData.cureCycleNumber);
      setNcrNumber(initialData.ncrNumber || '');
      setNotes(initialData.notes);
      setTimestamp(formatDateForInput(new Date(initialData.timestamp)));
      
      if (initialData.ncrRaisedTimestamp) {
          setNcrRaisedTimestamp(formatDateForInput(new Date(initialData.ncrRaisedTimestamp)));
      } else {
          setNcrRaisedTimestamp('');
      }
      setNcrStatus(initialData.ncrStatus || NcrStatus.OPEN);

    } else {
      // Default values for new entry
      if (issueOptions.length > 0) setType(issueOptions[0].value);
      if (plantOptions.length > 0) setPlantNumber(plantOptions[0].value);
      if (projectOptions.length > 0) setProject(projectOptions[0].value);
      setStatus(IssueStatus.NO);
      setCureCycleNumber('');
      setNcrNumber('');
      setNotes('');
      setTimestamp(formatDateForInput(new Date()));
      setNcrRaisedTimestamp('');
      setNcrStatus(NcrStatus.OPEN);
    }
  }, [initialData, issueOptions.length, plantOptions.length, projectOptions.length]);

  // Effect to handle NCR timestamp default when status changes
  useEffect(() => {
    if (status === IssueStatus.YES && !ncrRaisedTimestamp) {
        setNcrRaisedTimestamp(formatDateForInput(new Date()));
    } else if (status === IssueStatus.NO) {
        setNcrRaisedTimestamp('');
        setNcrNumber('');
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construct ISO string from date input (handling local time logic)
    const [y, m, d] = timestamp.split('-').map(Number);
    // Create date at local midnight
    const dateObj = new Date(y, m - 1, d);
    
    // If selected date is today, use current time, otherwise use noon (12:00)
    // to ensure it falls safely within the day across timezones when displayed
    const now = new Date();
    if (dateObj.toDateString() === now.toDateString()) {
        dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    } else {
        dateObj.setHours(12, 0, 0, 0);
    }

    // Process NCR Raised Timestamp
    let formattedNcrTimestamp = undefined;
    if (status === IssueStatus.YES && ncrRaisedTimestamp) {
      const [ny, nm, nd] = ncrRaisedTimestamp.split('-').map(Number);
      const ncrDate = new Date(ny, nm - 1, nd);
      // Set to noon to avoid timezone date shifts
      ncrDate.setHours(12, 0, 0, 0);
      formattedNcrTimestamp = ncrDate.toISOString();
    }

    onSubmit({
      type,
      plantNumber,
      project,
      status,
      cureCycleNumber: cureCycleNumber.trim() || 'N/A',
      ncrNumber: status === IssueStatus.YES ? ncrNumber || undefined : undefined,
      notes,
      timestamp: dateObj.toISOString(),
      ncrStatus: status === IssueStatus.YES ? ncrStatus : undefined,
      ncrRaisedTimestamp: formattedNcrTimestamp
    });
  };

  const isEditing = !!initialData;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 text-slate-800">
          {isEditing ? (
            <Pencil className="w-6 h-6 text-blue-600" />
          ) : (
            <PlusCircle className="w-6 h-6 text-blue-600" />
          )}
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Cure Issue' : 'Log New Cure Issue'}</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
             type="button"
             onClick={() => setActiveModal('issues')}
             className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors font-medium"
          >
            <Settings className="w-3.5 h-3.5" /> Issues
          </button>
          <button
             type="button"
             onClick={() => setActiveModal('plants')}
             className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors font-medium"
          >
             <Settings className="w-3.5 h-3.5" /> Plants
          </button>
          <button
             type="button"
             onClick={() => setActiveModal('projects')}
             className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors font-medium"
          >
             <Settings className="w-3.5 h-3.5" /> Projects
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {issueOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plant Number</label>
            <select 
              value={plantNumber} 
              onChange={(e) => setPlantNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {plantOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
            <select 
              value={project} 
              onChange={(e) => setProject(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {projectOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cure Cycle Number <span className="text-slate-400 font-normal ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              value={cureCycleNumber}
              onChange={(e) => setCureCycleNumber(e.target.value)}
              placeholder="e.g. CC-1024"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NCR Raised?</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {status === IssueStatus.YES && (
            <>
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50 p-4 rounded-lg border border-red-100 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-red-800 mb-1">
                      NCR Number <span className="text-red-500 font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={ncrNumber}
                      onChange={(e) => setNcrNumber(e.target.value)}
                      placeholder="e.g. NCR-2024-001"
                      className="w-full p-2.5 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-800 mb-1">
                      Date NCR Raised
                    </label>
                    <input
                      type="date"
                      value={ncrRaisedTimestamp}
                      onChange={(e) => setNcrRaisedTimestamp(e.target.value)}
                      className="w-full p-2.5 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Describe the failure details, observations, and initial actions..."
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {isEditing && initialData && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete(initialData.id);
              }}
              className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center gap-2 min-w-[100px]"
              title="Delete this record"
            >
              <Trash2 className="w-4 h-4 pointer-events-none" />
              <span>Delete</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </form>

      {/* Options Modals */}
      <OptionsModal
        isOpen={activeModal === 'issues'}
        onClose={() => setActiveModal(null)}
        title="Issue"
        options={issueOptions}
        setOptions={setIssueOptions}
        withColor={true}
      />
      <OptionsModal
        isOpen={activeModal === 'plants'}
        onClose={() => setActiveModal(null)}
        title="Plant"
        options={plantOptions}
        setOptions={setPlantOptions}
        withColor={false}
      />
      <OptionsModal
        isOpen={activeModal === 'projects'}
        onClose={() => setActiveModal(null)}
        title="Project"
        options={projectOptions}
        setOptions={setProjectOptions}
        withColor={false}
      />
    </div>
  );
};

export default IssueForm;