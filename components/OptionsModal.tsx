import React, { useState } from 'react';
import { OptionItem } from '../types';
import { X, Plus, Trash2, Settings2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: OptionItem[];
  setOptions: React.Dispatch<React.SetStateAction<OptionItem[]>>;
  withColor?: boolean;
}

const PALETTE = [
  '#f87171', '#fb923c', '#facc15', '#60a5fa', '#94a3b8', '#a855f7', // Original
  '#4ade80', '#2dd4bf', '#22d3ee', '#818cf8', '#e879f9', '#fb7185'  // New additions
];

const OptionsModal: React.FC<OptionsModalProps> = ({ 
  isOpen, onClose, title, options, setOptions, withColor 
}) => {
  const [newValue, setNewValue] = useState('');
  const [optionToDelete, setOptionToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    // Check for duplicates
    if (options.some(opt => opt.value.toLowerCase() === newValue.trim().toLowerCase())) {
      alert('This option already exists.');
      return;
    }

    const newItem: OptionItem = {
      value: newValue.trim(),
      label: newValue.trim(),
      color: withColor ? PALETTE[Math.floor(Math.random() * PALETTE.length)] : undefined
    };

    setOptions(prev => [...prev, newItem]);
    setNewValue('');
  };

  const requestDelete = (value: string) => {
    setOptionToDelete(value);
  };

  const confirmDelete = () => {
    if (optionToDelete) {
      setOptions(prev => prev.filter(opt => opt.value !== optionToDelete));
      setOptionToDelete(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-slate-500" />
              Edit {title} Options
            </h3>
            <button 
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {options.length === 0 && (
              <p className="text-center text-slate-400 italic py-4">No options defined.</p>
            )}
            {options.map((opt) => (
              <div key={opt.value} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-100 transition-colors group shadow-sm">
                <div className="flex items-center gap-3">
                  {withColor && (
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm ring-1 ring-slate-100" 
                      style={{ backgroundColor: opt.color || '#ccc' }}
                    ></div>
                  )}
                  <span className="font-medium text-slate-700">{opt.label}</span>
                </div>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    requestDelete(opt.value);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove option"
                >
                  <Trash2 className="w-4 h-4 pointer-events-none" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Add new ${title.toLowerCase()}...`}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!newValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!optionToDelete}
        onClose={() => setOptionToDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${title} Option`}
        message={`Are you sure you want to remove "${optionToDelete}" from the list? This option will no longer be available for new records.`}
        confirmText="Delete Option"
      />
    </>
  );
};

export default OptionsModal;