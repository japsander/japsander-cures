

import React, { useState, useMemo } from 'react';
import { WeeklySchedule, OptionItem } from '../types';
// FIX: Imported the 'X' icon from lucide-react.
import { ChevronLeft, ChevronRight, Share, Sun, Moon, Home, List, Plus, Trash2, AlertTriangle, Settings, X } from 'lucide-react';
import ScheduleExportModal from './ScheduleExportModal';
import OptionsModal from './OptionsModal'; // Import OptionsModal

interface ScheduleViewProps {
  schedule: WeeklySchedule;
  onUpdate: (key: string, period: 'AM' | 'PM', value: string) => void;
  onReplaceSchedule: (newSchedule: WeeklySchedule) => void;
  onClearSchedule: () => void;
  presets: string[];
  onUpdatePresets: (presets: string[]) => void;
  onNavigate: (view: 'home') => void;
  plantOptions: OptionItem[];
  setPlantOptions: React.Dispatch<React.SetStateAction<OptionItem[]>>;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ 
  schedule, 
  onUpdate, 
  onReplaceSchedule, 
  onClearSchedule, 
  presets, 
  onUpdatePresets, 
  onNavigate,
  plantOptions,
  setPlantOptions
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');

  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isPlantsModalOpen, setIsPlantsModalOpen] = useState(false); // New state for plants modal
  const [newPreset, setNewPreset] = useState('');
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

  const getWeekDays = (refDate: Date) => {
    const startOfWeek = new Date(refDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday is start
    startOfWeek.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        week.push(d);
    }
    return week;
  };

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const changeDate = (delta: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + delta);
      return newDate;
    });
  };
  
  const changeWeek = (delta: number) => {
    changeDate(delta * 7);
  };

  const dateLabel = useMemo(() => {
    if (viewMode === 'weekly') {
        const start = weekDays[0];
        const end = weekDays[6];
        const startMonth = start.toLocaleString('default', { month: 'short' });
        const endMonth = end.toLocaleString('default', { month: 'short' });
        if (startMonth === endMonth) {
            return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        }
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    } else {
        return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }, [weekDays, currentDate, viewMode]);

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreset.trim()) return;
    if (presets.includes(newPreset.trim())) {
        alert("Preset already exists.");
        return;
    }
    onUpdatePresets([...presets, newPreset.trim()]);
    setNewPreset('');
  };

  const handleDeletePreset = () => {
    if (presetToDelete) {
        onUpdatePresets(presets.filter(p => p !== presetToDelete));
        setPresetToDelete(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 animate-fade-in">
       <datalist id="schedule-presets">{presets.map((p, i) => (<option key={i} value={p} />))}</datalist>

      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <Home className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Production Schedule</h2>
                <p className="text-slate-500 text-sm">Manage weekly and daily shift activities.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsPresetsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors shadow-sm whitespace-nowrap">
                <List className="w-4 h-4" /> Edit Presets
            </button>
            <button onClick={() => setIsPlantsModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors shadow-sm whitespace-nowrap">
                <Settings className="w-4 h-4" /> Edit Plants
            </button>
        </div>
      </header>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'weekly' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Weekly</button>
                <button onClick={() => setViewMode('daily')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewMode === 'daily' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Daily</button>
            </div>
             <h2 className="text-sm md:text-base font-bold text-slate-800 text-center">
              {dateLabel}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1">
              <button onClick={() => viewMode === 'weekly' ? changeWeek(-1) : changeDate(-1)} className="p-2 rounded-md hover:bg-slate-100"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="text-sm font-semibold px-3 py-1.5 rounded-md hover:bg-slate-100 border border-slate-200">Today</button>
              <button onClick={() => viewMode === 'weekly' ? changeWeek(1) : changeDate(1)} className="p-2 rounded-md hover:bg-slate-100"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"><Share className="w-4 h-4" /> Share / Export</button>
          </div>
        </div>
      </div>

      {/* Conditional View */}
      {viewMode === 'weekly' ? (
        <div className="space-y-4">
            {weekDays.map(day => {
            const dateString = day.toISOString().split('T')[0];
            const isToday = new Date().toDateString() === day.toDateString();

            return (
                <div key={dateString} className={`bg-white rounded-xl shadow-sm border ${isToday ? 'border-blue-300' : 'border-slate-200'}`}>
                <div className={`p-3 border-b rounded-t-xl ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <h3 className={`font-bold ${isToday ? 'text-blue-800' : 'text-slate-800'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'long' })}
                    <span className={`ml-2 text-sm font-medium ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>{day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                    </h3>
                </div>
                <div className="p-4 space-y-3">
                    {plantOptions.map(plant => {
                    const key = `${plant.value}-${dateString}`;
                    const amValue = schedule[key]?.AM || '';
                    const pmValue = schedule[key]?.PM || '';

                    return (
                        <div key={plant.value} className="flex flex-col md:flex-row md:items-center gap-2">
                           <label className="font-semibold text-sm w-full md:w-48 flex items-center gap-2 flex-shrink-0">
                             <div className="w-2 h-5 rounded" style={{ backgroundColor: plant.color }}></div>
                             {plant.label}
                           </label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                             <div className="flex items-center gap-2 bg-amber-50/50 p-2 rounded-md border border-amber-100">
                               <Sun className="w-4 h-4 text-amber-500 shrink-0"/>
                               <input type="text" list="schedule-presets" value={amValue} onChange={e => onUpdate(key, 'AM', e.target.value)} placeholder="AM..." className="w-full bg-transparent outline-none text-sm focus:ring-1 focus:ring-amber-300 rounded px-1"/>
                             </div>
                             <div className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-md border border-indigo-100">
                               <Moon className="w-4 h-4 text-indigo-500 shrink-0"/>
                               <input type="text" list="schedule-presets" value={pmValue} onChange={e => onUpdate(key, 'PM', e.target.value)} placeholder="PM..." className="w-full bg-transparent outline-none text-sm focus:ring-1 focus:ring-indigo-300 rounded px-1"/>
                             </div>
                           </div>
                         </div>
                    );
                    })}
                </div>
                </div>
            );
            })}
        </div>
      ) : (
        <div className="space-y-4">
            {(() => {
                const day = currentDate;
                const dateString = day.toISOString().split('T')[0];
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                    <div className={`bg-white rounded-xl shadow-sm border ${isToday ? 'border-blue-300' : 'border-slate-200'}`}>
                        <div className="p-4 space-y-4">
                            {plantOptions.map(plant => {
                            const key = `${plant.value}-${dateString}`;
                            const amValue = schedule[key]?.AM || '';
                            const pmValue = schedule[key]?.PM || '';
                            return (
                                <div key={plant.value} className="flex flex-col md:flex-row md:items-center gap-2">
                                <label className="font-semibold text-sm w-full md:w-48 flex items-center gap-2 flex-shrink-0">
                                    <div className="w-2 h-5 rounded" style={{ backgroundColor: plant.color }}></div>
                                    {plant.label}
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                    <div className="flex items-center gap-2 bg-amber-50/50 p-2 rounded-md border border-amber-100">
                                    <Sun className="w-4 h-4 text-amber-500 shrink-0"/>
                                    <input type="text" list="schedule-presets" value={amValue} onChange={e => onUpdate(key, 'AM', e.target.value)} placeholder="AM..." className="w-full bg-transparent outline-none text-sm focus:ring-1 focus:ring-amber-300 rounded px-1"/>
                                    </div>
                                    <div className="flex items-center gap-2 bg-indigo-50/50 p-2 rounded-md border border-indigo-100">
                                    <Moon className="w-4 h-4 text-indigo-500 shrink-0"/>
                                    <input type="text" list="schedule-presets" value={pmValue} onChange={e => onUpdate(key, 'PM', e.target.value)} placeholder="PM..." className="w-full bg-transparent outline-none text-sm focus:ring-1 focus:ring-indigo-300 rounded px-1"/>
                                    </div>
                                </div>
                                </div>
                            );
                            })}
                        </div>
                    </div>
                )
            })()}
        </div>
      )}
      
      <ScheduleExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} schedule={schedule} onReplaceSchedule={onReplaceSchedule} weekDays={weekDays} plantOptions={plantOptions} />

      {/* Presets Modal */}
      {isPresetsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" />
                Edit Schedule Presets
              </h3>
              <button onClick={() => setIsPresetsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPreset} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={newPreset}
                    onChange={(e) => setNewPreset(e.target.value)}
                    placeholder="Add new preset..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                />
                <button 
                    type="submit"
                    disabled={!newPreset.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {presets.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 italic text-sm">No presets defined.</p>
                ) : (
                    presets.map((preset, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                            <span className="text-sm text-slate-700 font-medium">{preset}</span>
                            <button 
                                onClick={() => setPresetToDelete(preset)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Plants Modal */}
      <OptionsModal
        isOpen={isPlantsModalOpen}
        onClose={() => setIsPlantsModalOpen(false)}
        title="Plant"
        options={plantOptions}
        setOptions={setPlantOptions}
        withColor={true}
      />

      {/* Delete Preset Confirmation Modal */}
      {presetToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Preset?</h3>
                  <p className="text-slate-500 text-sm mb-6">
                      Are you sure you want to delete the preset "{presetToDelete}"? This cannot be undone.
                  </p>
                  <div className="flex gap-3 w-full">
                      <button onClick={() => setPresetToDelete(null)} className="flex-1 py-2 rounded-lg border border-slate-300">Cancel</button>
                      <button onClick={handleDeletePreset} className="flex-1 py-2 rounded-lg bg-red-600 text-white">Delete</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ScheduleView;