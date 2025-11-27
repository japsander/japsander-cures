
import React, { useState } from 'react';
import { IssueLog, OptionItem, WeeklySchedule, OutlifeItem, MemorableDate } from '../types';
import { Download, Upload, Copy, Check, X, RefreshCw, Smartphone } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface DataTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: IssueLog[];
  issueOptions: OptionItem[];
  plantOptions: OptionItem[];
  projectOptions: OptionItem[];
  schedule: WeeklySchedule;
  schedulePresets: string[];
  outlifeItems: OutlifeItem[];
  memorableDates: MemorableDate[];
  onImport: (data: { 
    logs?: IssueLog[], 
    settings?: {
      issues?: OptionItem[], 
      plants?: OptionItem[], 
      projects?: OptionItem[],
      schedulePresets?: string[]
    },
    schedule?: WeeklySchedule,
    outlifeItems?: OutlifeItem[],
    memorableDates?: MemorableDate[]
  }) => void;
}

const DataTransferModal: React.FC<DataTransferModalProps> = ({ 
  isOpen, 
  onClose, 
  logs, 
  issueOptions,
  plantOptions,
  projectOptions,
  schedule,
  schedulePresets,
  outlifeItems,
  memorableDates,
  onImport 
}) => {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();
  
  if (!isOpen) return null;

  const isSingleRecord = logs.length === 1 && !schedule && !outlifeItems;
  const itemLabel = isSingleRecord ? 'Record' : 'Full Backup';

  const createExportPayload = () => {
    return {
      version: 2,
      logs: logs,
      settings: {
        issues: issueOptions,
        plants: plantOptions,
        projects: projectOptions,
        schedulePresets: schedulePresets
      },
      schedule: schedule,
      outlifeItems: outlifeItems,
      memorableDates: memorableDates
    };
  };

  const generateShareCode = () => {
    try {
      const payload = createExportPayload();
      const json = JSON.stringify(payload);
      return btoa(unescape(encodeURIComponent(json)));
    } catch (e) {
      return '';
    }
  };

  const shareCode = generateShareCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: `Cures Tracker ${itemLabel}`,
        text: shareCode,
        dialogTitle: 'Share Data via...',
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleDownload = () => {
    const payload = createExportPayload();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    a.download = isSingleRecord 
      ? `cures-record-${logs[0].id}.json` 
      : `cures-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processImport = (data: any) => {
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid data format. Expected a backup object.");
      }

      const hasLogs = data.logs && Array.isArray(data.logs) && data.logs.length > 0;
      const hasSettings = data.settings && typeof data.settings === 'object';
      const hasSchedule = data.schedule && typeof data.schedule === 'object' && Object.keys(data.schedule).length > 0;
      const hasOutlife = data.outlifeItems && Array.isArray(data.outlifeItems) && data.outlifeItems.length > 0;
      const hasMemorableDates = data.memorableDates && Array.isArray(data.memorableDates) && data.memorableDates.length > 0;

      if (!hasLogs && !hasSettings && !hasSchedule && !hasOutlife && !hasMemorableDates) {
        throw new Error("No valid data found in the import file.");
      }

      onImport({
        logs: data.logs || [],
        settings: data.settings || {},
        schedule: data.schedule,
        outlifeItems: data.outlifeItems || [],
        memorableDates: data.memorableDates || []
      });

      setSuccessMsg(`Successfully imported data.`);
      setImportText('');
      setTimeout(() => {
          setSuccessMsg(null);
          onClose();
      }, 2000);
  }

  const handleImportText = () => {
    setError(null);
    setSuccessMsg(null);
    try {
      if (!importText.trim()) return;
      let jsonString = '';
      try {
          jsonString = decodeURIComponent(escape(window.atob(importText)));
      } catch {
          jsonString = importText; // Assume it's raw JSON if base64 decoding fails
      }
      const parsed = JSON.parse(jsonString);
      processImport(parsed);
    } catch (err: any) {
      setError(err.message || "Failed to parse data. Ensure it's a valid backup code or JSON file content.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = JSON.parse(result);
        processImport(parsed);
      } catch (err) {
        setError("Failed to parse file. Make sure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            {isSingleRecord ? 'Share Individual Record' : 'Backup & Share All Data'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex border-b border-slate-200">
            <button className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'export' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`} onClick={() => setMode('export')}>Export</button>
            <button className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'import' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-600 hover:bg-slate-50'}`} onClick={() => setMode('import')}>Import</button>
        </div>
        <div className="p-6 overflow-y-auto">
            {mode === 'export' ? (
                <div className="space-y-6">
                    {isNative && (
                        <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Share via Quick Share / App (Recommended)</label>
                            <p className="text-xs text-slate-500 mb-3">Use your phone's built-in sharing feature to send to nearby devices (Bluetooth/Wi-Fi) or other apps.</p>
                            <button onClick={handleNativeShare} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-md"><Smartphone className="w-5 h-5" /> Share via Quick Share / App</button>
                        </div>
                        <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400 uppercase">Or</span></div></div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Copy Hash Key</label>
                        <p className="text-xs text-slate-500 mb-3">Copy this code manually to paste on another device.</p>
                        <div className="relative mb-3">
                             <textarea readOnly value={shareCode} className="w-full h-24 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-600 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
                             <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-colors" title="Copy to Clipboard">
                                 {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                             </button>
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Download File</label>
                        <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-medium transition-colors">
                            <Download className="w-4 h-4" /> Download .json File
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Option 1: Upload Backup File</label>
                        <div className="relative">
                            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" id="file-upload" />
                            <label htmlFor="file-upload" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-medium transition-colors cursor-pointer"><Upload className="w-4 h-4" /> Select File</label>
                        </div>
                    </div>
                    <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400 uppercase">Or</span></div></div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Option 2: Paste Hash Key</label>
                        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste the hash key code here..." className="w-full h-24 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-600 resize-none focus:ring-2 focus:ring-blue-500 outline-none mb-3" />
                        <button onClick={handleImportText} disabled={!importText.trim()} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Import & Merge Data</button>
                    </div>
                    {error && (<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><X className="w-4 h-4" />{error}</div>)}
                    {successMsg && (<div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2"><Check className="w-4 h-4" />{successMsg}</div>)}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DataTransferModal;
