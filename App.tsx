

import React, { useState, useEffect, useCallback } from 'react';
import { IssueLog, OptionItem, IssueStatus, WeeklySchedule, OutlifeItem, MemorableDate } from './types';
import { ISSUE_OPTIONS as DEFAULT_ISSUE_OPTIONS, PLANT_OPTIONS as DEFAULT_PLANT_OPTIONS, PROJECT_OPTIONS as DEFAULT_PROJECT_OPTIONS, generateMockData, generateMockScheduleData } from './constants';
import Dashboard from './components/Dashboard';
import IssueForm from './components/IssueForm';
import IssueList from './components/IssueList';
import ScheduleView from './components/ScheduleView';
import Homepage from './components/Homepage';
import OutlifeCalculator from './components/OutlifeCalculator';
import ConfirmationModal from './components/ConfirmationModal';
import AdminAuthModal from './components/AdminAuthModal';
import DataTransferModal from './components/DataTransferModal';
import NcrMissingModal from './components/NcrMissingModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import { Home, LayoutDashboard, Plus, History, ShieldCheck, AlertCircle, CalendarRange, PackageCheck } from 'lucide-react';

type View = 'home' | 'dashboard' | 'form' | 'list' | 'schedule' | 'outlife';
type AdminAction = 'toggleMode' | 'clearData';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  
  const [logs, setLogs] = useState<IssueLog[]>(() => JSON.parse(localStorage.getItem('cures_logs_v2') || '[]'));
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => JSON.parse(localStorage.getItem('cures_schedule') || '{}'));
  const [schedulePresets, setSchedulePresets] = useState<string[]>(() => JSON.parse(localStorage.getItem('cures_schedule_presets') || '["Production", "Maintenance", "Idle", "Cleaning", "Setup"]'));
  const [outlifeItems, setOutlifeItems] = useState<OutlifeItem[]>(() => JSON.parse(localStorage.getItem('cures_outlife_items') || '[]'));
  const [memorableDates, setMemorableDates] = useState<MemorableDate[]>(() => JSON.parse(localStorage.getItem('cures_memorable_dates') || '[]'));
  
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('cures_admin_pwd') || 'ee9b5ac89c');
  const [editingLog, setEditingLog] = useState<IssueLog | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; logId: string | null; type: 'single' | 'all' }>({ isOpen: false, logId: null, type: 'single' });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<AdminAction>('toggleMode');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDataTransferOpen, setIsDataTransferOpen] = useState(false);
  const [exportData, setExportData] = useState<IssueLog[]>([]);
  const [isNcrMissingModalOpen, setIsNcrMissingModalOpen] = useState(false);

  const [issueOptions, setIssueOptions] = useState<OptionItem[]>(() => JSON.parse(localStorage.getItem('cures_issue_options') || JSON.stringify(DEFAULT_ISSUE_OPTIONS)));
  const [plantOptions, setPlantOptions] = useState<OptionItem[]>(() => JSON.parse(localStorage.getItem('cures_plant_options') || JSON.stringify(DEFAULT_PLANT_OPTIONS)));
  const [projectOptions, setProjectOptions] = useState<OptionItem[]>(() => JSON.parse(localStorage.getItem('cures_project_options') || JSON.stringify(DEFAULT_PROJECT_OPTIONS)));
  
  const [listFilters, setListFilters] = useState<{type?: string, status?: string, timeRange?: string, resolution?: string, ncrStatus?: string} | undefined>(undefined);
  
  const missingNcrLogs = logs.filter(log => log.status === IssueStatus.YES && (!log.ncrNumber || log.ncrNumber.trim() === ''));
  const pendingNcrCount = missingNcrLogs.length;

  useEffect(() => { localStorage.setItem('cures_logs_v2', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('cures_schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('cures_schedule_presets', JSON.stringify(schedulePresets)); }, [schedulePresets]);
  useEffect(() => { localStorage.setItem('cures_outlife_items', JSON.stringify(outlifeItems)); }, [outlifeItems]);
  useEffect(() => { localStorage.setItem('cures_memorable_dates', JSON.stringify(memorableDates)); }, [memorableDates]);
  useEffect(() => { localStorage.setItem('cures_issue_options', JSON.stringify(issueOptions)); }, [issueOptions]);
  useEffect(() => { localStorage.setItem('cures_plant_options', JSON.stringify(plantOptions)); }, [plantOptions]);
  useEffect(() => { localStorage.setItem('cures_project_options', JSON.stringify(projectOptions)); }, [projectOptions]);
  useEffect(() => { localStorage.setItem('cures_admin_pwd', adminPassword); }, [adminPassword]);

  const handleFormSubmit = (data: Omit<IssueLog, 'id'>) => {
    if (editingLog) {
      setLogs(prev => prev.map(log => log.id === editingLog.id ? { ...log, ...data } : log));
      setEditingLog(null);
      setView('list');
    } else {
      // FIX: Replaced deprecated 'substr' with 'substring' to prevent type errors.
      const entry: IssueLog = { ...data, id: Math.random().toString(36).substring(2, 11) };
      setLogs(prev => [entry, ...prev]);
      setView('dashboard');
    }
  };

  const handleUpdateLog = useCallback((id: string, updates: Partial<IssueLog>) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  }, []);

  const handleDeleteRequest = useCallback((id: string) => { setDeleteConfirmation({ isOpen: true, logId: id, type: 'single' }); }, []);
  
  const handleClearAllRequest = () => { 
    setPendingAdminAction('clearData');
    setIsAdminAuthOpen(true);
  };
  
  const handleAddTestDataRequest = () => {
    const newLogs = generateMockData(100);
    setLogs(prev => [...newLogs, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    const newSchedule = generateMockScheduleData();
    setSchedule(prev => ({ ...prev, ...newSchedule }));
  };

  const handleAdminAuthSuccess = () => { 
    setIsAdminAuthOpen(false); 
    if (pendingAdminAction === 'toggleMode') {
      setIsAdminMode(true); 
    } else if (pendingAdminAction === 'clearData') {
      setDeleteConfirmation({ isOpen: true, logId: null, type: 'all' });
    }
  };
  
  const handlePasswordChange = (newPwd: string) => { setAdminPassword(newPwd); alert("Admin password updated."); };

  const executeDelete = () => {
    if (deleteConfirmation.type === 'all') { 
        setLogs([]); 
        setSchedule({});
        setOutlifeItems([]);
        setMemorableDates([]);
        setEditingLog(null); 
        setView('dashboard'); 
    }
    else if (deleteConfirmation.logId) {
      setLogs(prev => prev.filter(log => log.id !== deleteConfirmation.logId));
      if (editingLog && editingLog.id === deleteConfirmation.logId) { setEditingLog(null); setView('list'); }
    }
    setDeleteConfirmation({ isOpen: false, logId: null, type: 'single' });
  };

  const handleEditStart = useCallback((log: IssueLog) => { setEditingLog(log); setView('form'); }, []);
  
  const handleDashboardFilter = useCallback((type?: string, status?: string, timeRange?: string, resolution?: string, ncrStatus?: string) => {
    setListFilters({ type, status, timeRange, resolution, ncrStatus });
    setView('list');
  }, []);
  
  const handleSidebarHistory = () => { setListFilters(undefined); setEditingLog(null); setView('list'); };
  const handleNewEntry = () => { setEditingLog(null); setView('form'); };
  
  const handleUpdateSchedule = useCallback((key: string, period: 'AM' | 'PM', value: string) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      if (!newSchedule[key]) {
        newSchedule[key] = { AM: '', PM: '' };
      }
      newSchedule[key] = { ...newSchedule[key], [period]: value };
      return newSchedule;
    });
  }, []);

  const handleToggleScheduleCompletion = useCallback((key: string, period: 'AM' | 'PM') => {
    setSchedule(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      return { ...prev, [key]: { ...entry, [period === 'AM' ? 'amCompleted' : 'pmCompleted']: !entry[period === 'AM' ? 'amCompleted' : 'pmCompleted'] } };
    });
  }, []);

  const handleReplaceSchedule = useCallback((newSchedule: WeeklySchedule) => { setSchedule(newSchedule); }, []);
  const handleClearSchedule = useCallback(() => { setSchedule({}); }, []);

  const handleDataImport = (data: { 
    logs?: IssueLog[], 
    settings?: {
      issues?: OptionItem[], 
      plants?: OptionItem[], 
      projectOptions?: OptionItem[],
      schedulePresets?: string[]
    },
    schedule?: WeeklySchedule,
    outlifeItems?: OutlifeItem[],
    memorableDates?: MemorableDate[]
  }) => {
    if (data.logs && data.logs.length > 0) {
      setLogs(prevLogs => {
        const existingIds = new Set(prevLogs.map(l => l.id));
        const newUniqueLogs = data.logs!.filter((l: IssueLog) => !existingIds.has(l.id));
        return [...newUniqueLogs, ...prevLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    }

    const mergeOpts = (current: OptionItem[], incoming: OptionItem[]) => {
       const existing = new Set(current.map(c => c.value.toLowerCase()));
       const toAdd = incoming.filter(i => !existing.has(i.value.toLowerCase()));
       return [...current, ...toAdd];
    };
    if (data.settings?.issues) setIssueOptions(prev => mergeOpts(prev, data.settings!.issues!));
    if (data.settings?.plants) setPlantOptions(prev => mergeOpts(prev, data.settings!.plants!));
    if (data.settings?.projectOptions) setProjectOptions(prev => mergeOpts(prev, data.settings!.projectOptions!));
    if (data.settings?.schedulePresets) setSchedulePresets(prev => [...new Set([...prev, ...data.settings!.schedulePresets!])]);
    
    if (data.schedule) setSchedule(prev => ({ ...prev, ...data.schedule }));
    
    if (data.outlifeItems) {
        setOutlifeItems(prevItems => {
            const existingIds = new Set(prevItems.map(item => item.id));
            const newUniqueItems = data.outlifeItems!.filter((item: OutlifeItem) => !existingIds.has(item.id));
            return [...prevItems, ...newUniqueItems];
        });
    }

    if (data.memorableDates) {
      setMemorableDates(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const newUnique = data.memorableDates!.filter((d: MemorableDate) => !existingIds.has(d.id));
        return [...prev, ...newUnique];
      });
    }
  };

  const handleBackupClick = () => { setExportData(logs); setIsDataTransferOpen(true); };
  const handleShareLog = useCallback((log: IssueLog) => { setExportData([log]); setIsDataTransferOpen(true); }, []);
  
  const handleNavigate = (targetView: View) => {
    setEditingLog(null);
    setView(targetView);
  }

  const fullScreenViews: View[] = ['home'];
  const isFullScreen = fullScreenViews.includes(view);

  const showSidebar = !isFullScreen && view !== 'schedule' && view !== 'outlife';

  return (
    <div className={`min-h-screen bg-slate-100 flex font-sans text-slate-900 ${isFullScreen || !showSidebar ? 'flex-col' : 'md:flex-row'}`}>
      {showSidebar && (
        <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col pt-[env(safe-area-inset-top)] md:pt-0">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">CURES</h1>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => handleNavigate('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:bg-slate-800`}>
              <Home className="w-5 h-5" /> Home
            </button>
            <button onClick={() => handleNavigate('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-5 h-5" /> MRB Dashboard
            </button>
            <button onClick={handleNewEntry} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'form' && !editingLog ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <Plus className="w-5 h-5" /> Log Issue
            </button>
            <button onClick={handleSidebarHistory} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${view === 'list' || (view === 'form' && editingLog) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <History className="w-5 h-5" /> History
            </button>
            {pendingNcrCount > 0 && <div className="px-4 mt-2 mb-2"><button onClick={() => setIsNcrMissingModalOpen(true)} className="w-full bg-red-900/30 border border-red-500/30 rounded-lg p-3 hover:bg-red-900/50"><div className="flex items-center gap-2 text-red-400 mb-1"><AlertCircle className="w-3.5 h-3.5" /><span className="text-xs font-bold uppercase">Action Needed</span></div><p className="text-xs text-slate-300"><span className="font-bold text-white">{pendingNcrCount}</span> NCRs missing numbers</p></button></div>}
          </nav>
        </aside>
      )}

      <main className={!showSidebar ? 'w-full' : 'flex-1 p-6 md:p-8 overflow-y-auto'}>
        {view === 'home' && (
          <Homepage 
            onNavigate={handleNavigate} 
            schedule={schedule} 
            plantOptions={plantOptions} 
            onToggleCompletion={handleToggleScheduleCompletion}
            onBackupClick={handleBackupClick}
            isAdminMode={isAdminMode}
            onAdminModeToggle={(isAdmin) => {
                if (isAdmin) {
                    setPendingAdminAction('toggleMode');
                    setIsAdminAuthOpen(true);
                } else {
                    setIsAdminMode(false);
                }
            }}
            onAdminAuth={() => {
                setPendingAdminAction('toggleMode');
                setIsAdminAuthOpen(true);
            }}
            onAddTestData={handleAddTestDataRequest}
            onClearData={handleClearAllRequest}
            onChangePassword={() => setIsChangePasswordOpen(true)}
            memorableDates={memorableDates}
            setMemorableDates={setMemorableDates}
          />
        )}
        {view === 'dashboard' && <Dashboard logs={logs} onFilterRequest={handleDashboardFilter} onUpdateLog={handleUpdateLog} issueOptions={issueOptions} />}
        {view === 'form' && <div className="max-w-2xl mx-auto"><IssueForm onSubmit={handleFormSubmit} onCancel={() => setView(editingLog ? 'list' : 'dashboard')} onDelete={handleDeleteRequest} initialData={editingLog || undefined} {...{ issueOptions, plantOptions, projectOptions, setIssueOptions, setPlantOptions, setProjectOptions }} /></div>}
        {view === 'list' && <IssueList logs={logs} onUpdateLog={handleUpdateLog} onDeleteLog={handleDeleteRequest} onEditLog={handleEditStart} onShareLog={handleShareLog} initialFilters={listFilters} {...{ issueOptions, plantOptions, projectOptions }} />}
        {view === 'schedule' && (
          <ScheduleView 
            schedule={schedule} 
            onUpdate={handleUpdateSchedule} 
            onReplaceSchedule={handleReplaceSchedule} 
            onClearSchedule={handleClearSchedule} 
            presets={schedulePresets} 
            onUpdatePresets={setSchedulePresets} 
            onNavigate={handleNavigate}
            plantOptions={plantOptions}
            setPlantOptions={setPlantOptions}
          />
        )}
        {view === 'outlife' && (
          <OutlifeCalculator onNavigate={handleNavigate} />
        )}
      </main>

      <ConfirmationModal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, logId: null, type: 'single' })} onConfirm={executeDelete} title={deleteConfirmation.type === 'all' ? "Clear All Data" : "Delete Record"} message={deleteConfirmation.type === 'all' ? "This will delete ALL records, including logs, schedule, and outlife data. This action cannot be undone." : "This will delete the record."} />
      <AdminAuthModal isOpen={isAdminAuthOpen} onClose={() => setIsAdminAuthOpen(false)} onSuccess={handleAdminAuthSuccess} expectedPassword={adminPassword} actionDescription={pendingAdminAction === 'clearData' ? "clear all application data" : "enable admin mode"} />
      <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} currentPasswordHash={adminPassword} onPasswordChange={handlePasswordChange} />
      <DataTransferModal 
        isOpen={isDataTransferOpen} 
        onClose={() => setIsDataTransferOpen(false)} 
        logs={exportData} 
        {...{issueOptions, plantOptions, projectOptions, schedule, schedulePresets, outlifeItems, memorableDates, onImport: handleDataImport}} 
      />
      <NcrMissingModal isOpen={isNcrMissingModalOpen} onClose={() => setIsNcrMissingModalOpen(false)} logs={missingNcrLogs} onUpdateLog={handleUpdateLog} />
    </div>
  );
};

export default App;