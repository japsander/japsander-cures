import React, { useState, useMemo, useEffect } from 'react';
import { Home, Timer, Thermometer, Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface OutlifeCalculatorProps {
  onNavigate: (view: 'home') => void;
}

// Helper to get current date-time in YYYY-MM-DDTHH:mm format
const getLocalDateTimeString = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to format date-time string to dd/mm/yyyy HH:mm
const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';

    const pad = (num: number) => String(num).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};


const OutlifeCalculator: React.FC<OutlifeCalculatorProps> = ({ onNavigate }) => {
  const [currentHours, setCurrentHours] = useState('');
  const [outOfFreezerTime, setOutOfFreezerTime] = useState('');
  const [startsCureTime, setStartsCureTime] = useState('');

  // Set default times on mount for better UX
  useEffect(() => {
    const now = new Date();
    setOutOfFreezerTime(getLocalDateTimeString(now));
    
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setStartsCureTime(getLocalDateTimeString(oneHourLater));
  }, []);

  const calculationResult = useMemo(() => {
    const initialHours = parseFloat(currentHours);
    if (isNaN(initialHours) || !outOfFreezerTime || !startsCureTime) {
      return null;
    }

    const outTime = new Date(outOfFreezerTime).getTime();
    const cureTime = new Date(startsCureTime).getTime();

    if (isNaN(outTime) || isNaN(cureTime) || cureTime < outTime) {
      return {
        isValid: false,
        message: 'Cure time must be after freezer time.'
      };
    }

    const exposureMilliseconds = cureTime - outTime;
    const exposureHours = exposureMilliseconds / (1000 * 60 * 60);

    const remainingHours = initialHours - exposureHours;
    
    // Calculate "Cure By" time
    const cureByTimestamp = outTime + (initialHours * 60 * 60 * 1000);
    const cureByTime = new Date(cureByTimestamp);

    return {
      isValid: true,
      remainingHours: remainingHours,
      isExpired: remainingHours < 0,
      cureByTime: cureByTime
    };

  }, [currentHours, outOfFreezerTime, startsCureTime]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <Home className="w-5 h-5" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Outlife Calculator</h2>
                <p className="text-slate-500 text-sm">Calculate remaining material outlife at cure.</p>
            </div>
        </div>
      </header>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-lg mx-auto">
        <div className="space-y-6">
            {/* Input 1: Current Hours Remaining */}
            <div>
                <label htmlFor="currentHours" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Timer className="w-4 h-4 text-slate-400" />
                    Current Hours Remaining
                </label>
                <input
                    id="currentHours"
                    type="number"
                    value={currentHours}
                    onChange={(e) => setCurrentHours(e.target.value)}
                    placeholder="e.g., 720"
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Input 2: Time out of Freezer */}
            <div>
                <label htmlFor="outOfFreezer" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Thermometer className="w-4 h-4 text-slate-400" />
                    Time Out of Freezer
                </label>
                <input
                    id="outOfFreezer"
                    type="datetime-local"
                    value={outOfFreezerTime}
                    onChange={(e) => setOutOfFreezerTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {outOfFreezerTime && (
                    <p className="text-xs text-slate-400 mt-1.5 text-center">{formatDateTime(outOfFreezerTime)}</p>
                )}
            </div>

            {/* Input 3: Time Starts Cure */}
            <div>
                <label htmlFor="startsCure" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Time Starts Cure
                </label>
                <input
                    id="startsCure"
                    type="datetime-local"
                    value={startsCureTime}
                    onChange={(e) => setStartsCureTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                 {startsCureTime && (
                    <p className="text-xs text-slate-400 mt-1.5 text-center">{formatDateTime(startsCureTime)}</p>
                )}
            </div>
        </div>
        
        {/* Result Section */}
        <div className="mt-8 pt-6 border-t border-slate-200">
            {calculationResult === null && (
                <div className="text-center text-slate-400">
                    <p>Enter all values to see the result.</p>
                </div>
            )}

            {calculationResult && !calculationResult.isValid && (
                 <div className="flex items-center justify-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="font-medium">{calculationResult.message}</p>
                </div>
            )}

            {calculationResult && calculationResult.isValid && (
                <div className={`text-center p-4 rounded-lg border ${
                    calculationResult.isExpired
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                    {calculationResult.isExpired ? (
                        <>
                            <div className="flex justify-center items-center gap-2 mb-1">
                                <AlertTriangle className="w-6 h-6" />
                                <h3 className="text-lg font-bold">Material Will Be EXPIRED</h3>
                            </div>
                            <p>
                                It will be out of spec by <strong>{Math.abs(calculationResult.remainingHours).toFixed(2)} hours</strong> at time of cure.
                            </p>
                        </>
                    ) : (
                        <>
                             <div className="flex justify-center items-center gap-2 mb-1">
                                <CheckCircle2 className="w-6 h-6" />
                                <h3 className="text-lg font-bold">Material is OK to Use</h3>
                            </div>
                            <p>
                                It will have <strong>{calculationResult.remainingHours.toFixed(2)} hours</strong> of outlife remaining at time of cure.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>

        {/* Cure By Note */}
        {calculationResult?.cureByTime && (
            <div className="mt-6 p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-sm text-center">
                 <div className="flex items-center justify-center gap-2">
                    <Info className="w-4 h-4" />
                    <p>
                        Material must start cure by: <strong>{formatDateTime(calculationResult.cureByTime.toISOString())}</strong>
                    </p>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default OutlifeCalculator;