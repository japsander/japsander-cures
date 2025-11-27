
import React, { useState } from 'react';
import { WeeklySchedule, OptionItem } from '../types';
import { Copy, Check, X, RefreshCw, Upload, Smartphone, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface ScheduleExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: WeeklySchedule;
  onReplaceSchedule: (newSchedule: WeeklySchedule) => void;
  weekDays: Date[];
  plantOptions: OptionItem[]; // Use dynamic prop
}

const ScheduleExportModal: React.FC<ScheduleExportModalProps> = ({
  isOpen,
  onClose,
  schedule,
  onReplaceSchedule,
  weekDays,
  plantOptions, // Use dynamic prop
}) => {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importString, setImportString] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  
  if (!isOpen) return null;

  const generateHash = () => {
    try {
      const payload = { version: 2, schedule: schedule };
      const json = JSON.stringify(payload);
      return btoa(unescape(encodeURIComponent(json)));
    } catch (err) {
      console.error("Hash generation failed", err);
      return '';
    }
  };

  const handleCopyHash = async () => {
    const hash = generateHash();
    if (!hash) { alert("Failed to generate schedule data."); return; }
    try {
      await navigator.clipboard.writeText(hash);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert("Failed to copy schedule data.");
    }
  };

  const handleNativeShare = async () => {
    const hash = generateHash();
    if (!hash) { alert("Failed to generate schedule data for sharing."); return; }
    try {
      await Share.share({
        title: 'Cures Tracker Schedule',
        text: hash,
        dialogTitle: 'Share Schedule via...',
      });
    } catch (err) {
      console.error("Native share failed:", err);
    }
  };

  const executeImport = () => {
    if (!importString.trim()) { alert("Please paste a schedule code."); return; }
    try {
      const jsonString = decodeURIComponent(escape(window.atob(importString.trim())));
      const parsed = JSON.parse(jsonString);
      if (!parsed.schedule || typeof parsed.schedule !== 'object') throw new Error("Invalid format");
      onReplaceSchedule(parsed.schedule);
      alert("Schedule successfully updated!");
      onClose();
    } catch (err) {
      alert("Error importing schedule. The code may be invalid.");
    }
  };

  const handleExportPdf = async () => {
    const doc = new jsPDF();
    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];
    const title = `Weekly Schedule: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    let yPos = 30;

    for (const day of weekDays) {
        const dateString = day.toISOString().split('T')[0];
        
        let entriesForDay: {plant: string, am: string, pm: string}[] = [];

        plantOptions.forEach(plant => {
            const key = `${plant.value}-${dateString}`;
            const entry = schedule[key];
            if(entry && (entry.AM.trim() || entry.PM.trim())) {
                entriesForDay.push({
                    plant: plant.label,
                    am: entry.AM.trim() || '-',
                    pm: entry.PM.trim() || '-'
                });
            }
        });

        if (entriesForDay.length > 0) {
            if (yPos > 250) { // Page break check
                doc.addPage();
                yPos = 20;
            }
            const dayHeader = day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(dayHeader, 14, yPos);
            yPos += 2;

            autoTable(doc, {
                startY: yPos,
                head: [['Plant / Equipment', 'AM Shift', 'PM Shift']],
                body: entriesForDay.map(e => [e.plant, e.am, e.pm]),
                theme: 'striped',
                headStyles: { fillColor: [45, 55, 72] }
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
        }
    }
    
    const fileName = `Weekly_Schedule_${weekStart.toISOString().split('T')[0]}.pdf`;
    
    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      try {
        const result = await Filesystem.writeFile({ path: fileName, data: pdfBase64, directory: Directory.Cache });
        await Share.share({ title: title, text: `Attached: ${title}`, files: [result.uri] });
      } catch (error) { console.error(error); alert("Could not share PDF."); }
    } else {
      doc.save(fileName);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-blue-600" /> Share / Export Schedule</h3>
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Share via Quick Share / App</label>
                    <p className="text-xs text-slate-500 mb-3">Share with nearby devices via Bluetooth/Wi-Fi or to other apps like WhatsApp.</p>
                    <button onClick={handleNativeShare} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-md"><Smartphone className="w-5 h-5" /> Quick Share (Bluetooth)</button>
                  </div>
                  <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400 uppercase">Or</span></div></div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Copy Schedule Code</label>
                <p className="text-xs text-slate-500 mb-3">Copy this code to transfer the schedule to another device.</p>
                <button onClick={handleCopyHash} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">{copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copySuccess ? "Copied!" : "Copy Schedule"}</button>
              </div>
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div><div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400 uppercase">Or</span></div></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Export as PDF</label>
                <p className="text-xs text-slate-500 mb-3">Generate a PDF of the current week's schedule.</p>
                <button onClick={handleExportPdf} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"><FileDown className="w-4 h-4" /> Download PDF</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Import Schedule</label>
                <p className="text-xs text-slate-500 mb-3">Paste the schedule code from another device to overwrite the current schedule.</p>
                <textarea value={importString} onChange={(e) => setImportString(e.target.value)} placeholder="Paste schedule code here..." className="w-full h-32 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-600 resize-none focus:ring-2 focus:ring-amber-500 outline-none mb-3" />
                <button onClick={executeImport} disabled={!importString.trim()} className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Upload className="w-4 h-4" /> Import & Overwrite</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleExportModal;
