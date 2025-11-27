import React, { useMemo, useState } from 'react';
import { ShieldCheck, CalendarRange, PackageCheck, CheckSquare, Square, Sun, Moon, CalendarCheck, Share2, Lock, Unlock, Database, Trash2, KeyRound, Info, X, Pencil, Plus, CalendarDays, AlertTriangle } from 'lucide-react';
import { WeeklySchedule, OptionItem, MemorableDate } from '../types';

type View = 'dashboard' | 'schedule' | 'outlife';

interface HomepageProps {
  onNavigate: (view: View) => void;
  schedule?: WeeklySchedule;
  plantOptions?: OptionItem[];
  onToggleCompletion?: (key: string, period: 'AM' | 'PM') => void;
  onBackupClick: () => void;
  isAdminMode: boolean;
  onAdminModeToggle: (isAdmin: boolean) => void;
  onAdminAuth: () => void;
  onAddTestData: () => void;
  onClearData: () => void;
  onChangePassword: () => void;
  memorableDates: MemorableDate[];
  setMemorableDates: React.Dispatch<React.SetStateAction<MemorableDate[]>>;
}

const Homepage: React.FC<HomepageProps> = ({ 
  onNavigate, 
  schedule, 
  plantOptions, 
  onToggleCompletion,
  onBackupClick,
  isAdminMode,
  onAdminModeToggle,
  onAdminAuth,
  onAddTestData,
  onClearData,
  onChangePassword,
  memorableDates,
  setMemorableDates
}) => {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);
  
  const todaysTasks = useMemo(() => {
    if (!schedule || !plantOptions) return [];
    
    const today = new Date().toISOString().split('T')[0];
    const tasks: { key: string; plantName: string; am: string; pm: string; amCompleted: boolean; pmCompleted: boolean; plantColor?: string; }[] = [];

    plantOptions.forEach(plant => {
        const key = `${plant.value}-${today}`;
        const entry = schedule[key];
        
        if (entry && (entry.AM?.trim() || entry.PM?.trim())) {
            tasks.push({
                key,
                plantName: plant.label,
                plantColor: plant.color,
                am: entry.AM?.trim() || '',
                pm: entry.PM?.trim() || '',
                amCompleted: !!entry.amCompleted,
                pmCompleted: !!entry.pmCompleted
            });
        }
    });
    
    return tasks;
  }, [schedule, plantOptions]);

  const todayDateDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  const allTasksCompleted = useMemo(() => {
    if (todaysTasks.length === 0) return false;
    return todaysTasks.every(task => {
        const amDone = !task.am || task.amCompleted;
        const pmDone = !task.pm || task.pmCompleted;
        return amDone && pmDone;
    });
  }, [todaysTasks]);
  
  const sortedDates = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    return [...memorableDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(d => {
        const date = new Date(d.date);
        date.setUTCHours(0,0,0,0); // Treat date as UTC to avoid timezone shifts in calculation
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {...d, daysRemaining: diffDays >= 0 ? diffDays : null };
      });
  }, [memorableDates]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 p-4 md:p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] relative">
      <button 
        onClick={() => isAdminMode ? onAdminModeToggle(false) : onAdminAuth()}
        className={`absolute top-4 right-4 p-2 rounded-full transition-all shadow-sm ${ isAdminMode ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50' }`}
        title={isAdminMode ? "Disable Admin Mode" : "Enable Admin Mode"}
      >
        {isAdminMode ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        <div className="text-center mb-8 md:mb-12 mt-8">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800">Welcome to the Cures Dashboard</h1>
          <p className="text-slate-500 mt-2">Select a module to begin</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full mb-10">
          <HomePageButton title="MRB" description="Issue tracking & analysis." icon={<ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />} onClick={() => onNavigate('dashboard')} color="blue" />
          <HomePageButton title="SCHEDULE" description="weekly cure plan" icon={<CalendarRange className="w-8 h-8 md:w-10 md:h-10" />} onClick={() => onNavigate('schedule')} color="emerald" />
          <HomePageButton title="OUTLIFE CALC" description="Material expiry tracking." icon={<PackageCheck className="w-8 h-8 md:w-10 md:h-10" />} onClick={() => onNavigate('outlife')} color="amber" />
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Today's Schedule Section */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800">Today's Schedule <span className="text-slate-400 font-normal text-sm ml-1">({todayDateDisplay})</span></h3>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    {allTasksCompleted ? (
                        <div className="text-center py-8 text-emerald-600 flex flex-col items-center gap-2 h-full justify-center">
                            <CheckSquare className="w-10 h-10" />
                            <p className="font-bold text-lg">All Tasks Complete!</p>
                        </div>
                    ) : todaysTasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 h-full flex items-center justify-center">
                            <p>No tasks scheduled for today.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todaysTasks.map(task => (
                                <div key={task.key} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        {task.plantColor && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.plantColor }}></div>}
                                        <span className="font-semibold text-sm text-slate-700">{task.plantName}</span>
                                    </div>
                                    <div className="space-y-2 pl-4">
                                        {task.am && (
                                            <div className={`flex items-start gap-3 cursor-pointer group ${task.amCompleted ? 'opacity-50' : ''}`} onClick={() => onToggleCompletion && onToggleCompletion(task.key, 'AM')}>
                                                <div className="mt-0.5 text-slate-400 group-hover:text-blue-500">{task.amCompleted ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}</div>
                                                <div className="flex-1 text-sm"><div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-0.5"><Sun className="w-3 h-3" /> AM</div><p className={`text-slate-700 ${task.amCompleted ? 'line-through text-slate-400' : ''}`}>{task.am}</p></div>
                                            </div>
                                        )}
                                        {task.pm && (
                                            <div className={`flex items-start gap-3 cursor-pointer group ${task.pmCompleted ? 'opacity-50' : ''}`} onClick={() => onToggleCompletion && onToggleCompletion(task.key, 'PM')}>
                                                <div className="mt-0.5 text-slate-400 group-hover:text-blue-500">{task.pmCompleted ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}</div>
                                                <div className="flex-1 text-sm"><div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mb-0.5"><Moon className="w-3 h-3" /> PM</div><p className={`text-slate-700 ${task.pmCompleted ? 'line-through text-slate-400' : ''}`}>{task.pm}</p></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Memorable Dates Section */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-slate-800">Memorable Dates</h3>
                    </div>
                    <button onClick={() => setIsDatesModalOpen(true)} className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 h-full flex items-center justify-center">
                            <p>No memorable dates saved.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedDates.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{item.description}</p>
                                        <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                                    </div>
                                    {item.daysRemaining !== null && (
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            item.daysRemaining === 0 ? 'bg-amber-100 text-amber-800' : item.daysRemaining < 7 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                            {item.daysRemaining === 0 ? 'Today' : `${item.daysRemaining} days`}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex items-center gap-4">
                <button onClick={onBackupClick} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-700 transition-all shadow-md"><Share2 className="w-5 h-5" />Backup / Share Data</button>
                <button onClick={() => setIsAboutModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 rounded-full font-medium hover:bg-slate-50 shadow-md border"><Info className="w-5 h-5" />About this App</button>
            </div>
            {isAdminMode && (
                <div className="grid grid-cols-3 gap-4 w-full max-w-lg animate-fade-in">
                    <SettingsButton icon={<Database className="w-5 h-5" />} label="Add Test Data" onClick={onAddTestData} color="text-emerald-600" />
                    <SettingsButton icon={<Trash2 className="w-5 h-5" />} label="Clear Data" onClick={onClearData} color="text-red-600" />
                    <SettingsButton icon={<KeyRound className="w-5 h-5" />} label="Change Password" onClick={onChangePassword} color="text-amber-600" />
                </div>
            )}
        </div>
      </div>

      {isAboutModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"><div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 flex flex-col items-center text-center"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4"><ShieldCheck className="w-6 h-6 text-blue-600" /></div><h3 className="text-lg font-bold text-slate-900">Cures Tracker</h3><p className="text-sm text-slate-500 mb-4">Version 1.0.0</p><p className="text-slate-600 text-sm mb-6 leading-relaxed">This application is designed to track manufacturing issues, manage schedules, and calculate material outlife.</p><p className="text-xs text-slate-400 italic mb-6">App developed by Colin Loosley</p><button onClick={() => setIsAboutModalOpen(false)} className="w-full py-2.5 px-4 rounded-lg bg-slate-200 text-slate-800 font-medium hover:bg-slate-300">Close</button></div></div>
      )}
      
      {isDatesModalOpen && <MemorableDatesModal dates={memorableDates} setDates={setMemorableDates} onClose={() => setIsDatesModalOpen(false)} />}
    </div>
  );
};

const HomePageButton: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; color: 'blue' | 'emerald' | 'amber'; }> = ({ title, description, icon, onClick, color }) => {
  const colors = { blue: 'bg-blue-600 hover:bg-blue-700 text-blue-100', emerald: 'bg-emerald-600 hover:bg-emerald-700 text-emerald-100', amber: 'bg-amber-600 hover:bg-amber-700 text-amber-100' };
  return ( <button onClick={onClick} className={`p-6 md:p-8 rounded-2xl text-left flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 active:scale-95 shadow-lg hover:shadow-xl ${colors[color]}`}>
      <div className="mb-4 md:mb-6">{icon}</div>
      <div><h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2><p className="text-xs md:text-sm mt-1 opacity-80">{description}</p></div>
    </button>
  );
};

const SettingsButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; color?: string; }> = ({ icon, label, onClick, color = 'text-slate-600' }) => {
    return (
        <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg text-center transition-colors bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md">
            <div className={color}>{icon}</div>
            <span className="text-xs font-semibold text-slate-600">{label}</span>
        </button>
    )
};

// New Modal for managing Memorable Dates
const MemorableDatesModal: React.FC<{ dates: MemorableDate[], setDates: React.Dispatch<React.SetStateAction<MemorableDate[]>>, onClose: () => void }> = ({ dates, setDates, onClose }) => {
    const [editingDate, setEditingDate] = useState<Partial<MemorableDate>>({});
    const [dateToDelete, setDateToDelete] = useState<MemorableDate | null>(null);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDate.date || !editingDate.description) return;

        if (editingDate.id) { // Update existing
            setDates(dates.map(d => d.id === editingDate.id ? editingDate as MemorableDate : d));
        } else { // Add new
            // FIX: Replaced deprecated 'substr' with 'substring' to prevent type errors.
            setDates([...dates, { ...editingDate, id: Math.random().toString(36).substring(2, 11) } as MemorableDate]);
        }
        setEditingDate({});
    };

    const confirmDelete = () => {
        if (dateToDelete) {
            setDates(dates.filter(d => d.id !== dateToDelete.id));
            setDateToDelete(null);
        }
    };

    return (
        <>
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Edit Memorable Dates</h3><button onClick={onClose}><X className="w-5" /></button></div>
                <div className="flex-1 p-4 overflow-y-auto space-y-2">
                    {dates.map(d => (
                        <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div><p className="font-medium text-slate-700">{d.description}</p><p className="text-xs text-slate-500">{new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p></div>
                            <div className="flex gap-1"><button onClick={() => setEditingDate(d)} className="p-2 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button><button onClick={() => setDateToDelete(d)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t bg-slate-50">
                    <form onSubmit={handleSave} className="space-y-2">
                        <p className="font-semibold text-sm">{editingDate.id ? 'Edit Date' : 'Add New Date'}</p>
                        <div className="flex gap-2"><input type="date" value={editingDate.date || ''} onChange={e => setEditingDate({...editingDate, date: e.target.value})} className="p-2 border rounded-lg flex-1" required /><input type="text" value={editingDate.description || ''} onChange={e => setEditingDate({...editingDate, description: e.target.value})} placeholder="Description" className="p-2 border rounded-lg flex-grow-[2]" required />
                            <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg"><Plus className="w-5" /></button>
                            {editingDate.id && <button type="button" onClick={() => setEditingDate({})} className="p-2 bg-slate-200 rounded-lg"><X className="w-5" /></button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
        {dateToDelete && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4"><div className="bg-white rounded-xl p-6 text-center max-w-sm"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div><h3 className="font-bold text-lg">Delete Date?</h3><p className="text-sm text-slate-500 my-2">Are you sure you want to delete "{dateToDelete.description}"?</p><div className="flex gap-3 mt-6"><button onClick={() => setDateToDelete(null)} className="flex-1 py-2 border rounded-lg">Cancel</button><button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Delete</button></div></div></div>
        )}
        </>
    );
}

export default Homepage;
