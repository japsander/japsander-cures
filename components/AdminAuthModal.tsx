
import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionDescription?: string;
  expectedPassword?: string;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  actionDescription = "proceed with this restricted action",
  expectedPassword = "ee9b5ac89c" // Default fallback
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleClose = () => {
    setError(false);
    setPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 transform transition-all scale-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Admin Authentication
          </h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Please enter the admin password to {actionDescription}.
        </p>

        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if(error) setError(false);
                    }}
                    placeholder="Enter password"
                    className={`w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ${error ? 'border-red-300 ring-red-200' : 'border-slate-300 focus:ring-blue-500'}`}
                    autoFocus
                />
                {error && (
                    <div className="flex items-center gap-1 text-red-600 text-xs mt-2">
                        <AlertCircle className="w-3 h-3" />
                        <span>Incorrect password</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                Unlock
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthModal;