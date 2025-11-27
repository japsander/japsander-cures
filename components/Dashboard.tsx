import React, { useMemo, useState, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { IssueLog, IssueStatus, OptionItem, NcrStatus, NcrResolution } from '../types';
import { 
  AlertCircle, Activity, TrendingUp, ChevronRight, FileDown, X, Calendar,
  ArrowUpRight, ArrowDownRight, Minus, Filter, CheckCircle2, Clock, FileCheck, Loader2 as Loader
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import NcrActionModal from './NcrActionModal';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import html2canvas from 'html2canvas';

interface DashboardProps {
  logs: IssueLog[];
  onFilterRequest: (type?: string, status?: string, timeRange?: string, resolution?: string, ncrStatus?: string) => void;
  onUpdateLog: (id: string, updates: Partial<IssueLog>) => void;
  issueOptions: OptionItem[];
}

type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';

// Helper component extracted to prevent re-mounting on every render
const TrendBadge = ({ current, previous, showTrend }: { current: number, previous: number, showTrend: boolean }) => {
  if (!showTrend) return null;
  if (previous === 0 && current === 0) return <span className="text-xs text-slate-400">-</span>;

  const diff = current - previous;
  const isUp = diff > 0;
  const isNeutral = diff === 0;

  let colorClass = "text-slate-500 bg-slate-100";
  let Icon = Minus;

  if (!isNeutral) {
    if (isUp) { colorClass = "text-red-600 bg-red-50"; Icon = ArrowUpRight; } 
    else { colorClass = "text-emerald-600 bg-emerald-50"; Icon = ArrowDownRight; }
  }

  const percent = previous > 0 ? Math.round((Math.abs(diff) / previous) * 100) : 100;

  return (
    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span>{Math.abs(diff)} {previous > 0 && `(${percent}%)`}</span>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ logs, onFilterRequest, onUpdateLog, issueOptions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedNcr, setSelectedNcr] = useState<IssueLog | null>(null);
  const [selectedTrendIssue, setSelectedTrendIssue] = useState<string>('ALL');
  const [selectedNcrTrendIssue, setSelectedNcrTrendIssue] = useState<string>('ALL');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const statsAnalysis = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now);
    
    currentStart.setHours(0,0,0,0);
    let currentEnd = new Date(now);
    currentEnd.setHours(23,59,59,999);

    let showTrend = true;

    if (timeRange === 'today') {
        // currentStart is already today 00:00
    } else if (timeRange === 'yesterday') {
        currentStart.setDate(currentStart.getDate() - 1);
        currentEnd = new Date(currentStart);
        currentEnd.setHours(23,59,59,999);
    } else if (timeRange === 'week') {
        const day = currentStart.getDay();
        const diff = currentStart.getDate() - day + (day === 0 ? -6 : 1);
        currentStart.setDate(diff);
        currentEnd = new Date(); // To now
    } else if (timeRange === 'month') {
        currentStart.setDate(1);
        currentEnd = new Date(); // To now
    } else if (timeRange === 'year') {
        currentStart.setMonth(0, 1);
        currentEnd = new Date(); // To now
    } else {
        showTrend = false;
        currentStart.setFullYear(1900);
        currentEnd = new Date();
    }

    const currentLogs = logs.filter(l => {
        const d = new Date(l.timestamp);
        return d >= currentStart && d <= currentEnd;
    });

    const getStats = (data: IssueLog[]) => {
        const total = data.length;
        const ncrLogs = data.filter(l => l.status === IssueStatus.YES);
        const ncrCount = ncrLogs.length;
        const ncrOpen = ncrLogs.filter(l => l.ncrStatus === NcrStatus.OPEN).length;
        const ncrClosed = ncrLogs.filter(l => l.ncrStatus === NcrStatus.CLOSED).length;
        const resUseAsIs = ncrLogs.filter(l => l.ncrResolution === NcrResolution.USE_AS_IS).length;
        const resRework = ncrLogs.filter(l => l.ncrResolution === NcrResolution.REWORK).length;
        const resScrap = ncrLogs.filter(l => l.ncrResolution === NcrResolution.SCRAP).length;
        const counts: Record<string, number> = {};
        data.forEach(l => { counts[l.type] = (counts[l.type] || 0) + 1; });
        const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return { total, ncrCount, ncrOpen, ncrClosed, resUseAsIs, resRework, resScrap, topIssue: topEntry ? topEntry[0] : 'None', topIssueCount: topEntry ? topEntry[1] : 0 };
    };

    const current = getStats(currentLogs);
    
    const previousStart = new Date(currentStart);
    
    if (timeRange === 'today' || timeRange === 'yesterday') {
        previousStart.setDate(previousStart.getDate() - 1);
    } else if(timeRange === 'week') {
        previousStart.setDate(previousStart.getDate() - 7);
    } else if(timeRange === 'month') {
        previousStart.setMonth(previousStart.getMonth() - 1);
    } else if(timeRange === 'year') {
        previousStart.setFullYear(previousStart.getFullYear() - 1);
    }

    const previousLogs = showTrend ? logs.filter(l => {
        const d = new Date(l.timestamp);
        return d >= previousStart && d < currentStart;
    }) : [];
    
    const previous = getStats(previousLogs);
    const prevTopIssueCount = previousLogs.filter(l => l.type === current.topIssue).length;

    return { current, previous, showTrend, prevTopIssueCount, currentLogs, previousLogs };
  }, [logs, timeRange]);
  
  const generateTrendData = (sourceLogs: IssueLog[], selectedIssue: string) => {
    const filteredLogs = selectedIssue === 'ALL'
      ? sourceLogs
      : sourceLogs.filter(log => log.type === selectedIssue);
    
    const displayFormat = (date: Date): string => {
        if (timeRange === 'week') return date.toLocaleDateString('en-US', { weekday: 'short' });
        if (timeRange === 'month') return date.toLocaleDateString('en-US', { day: 'numeric' });
        if (timeRange === 'year') return date.toLocaleDateString('en-US', { month: 'short' });
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    };

    const dataPoints: { date: string, count: number }[] = [];
    
    if (timeRange === 'today' || timeRange === 'yesterday') {
        const groupedByHour: Record<number, number> = {};
        for(let i=0; i<=23; i++) groupedByHour[i] = 0;

        filteredLogs.forEach(log => {
            const h = new Date(log.timestamp).getHours();
            groupedByHour[h]++;
        });

        Object.keys(groupedByHour).forEach(h => {
            const hour = parseInt(h);
            dataPoints.push({ date: `${String(hour).padStart(2, '0')}:00`, count: groupedByHour[hour] });
        });
    } else {
        const groupedData: Record<string, number> = {};
        filteredLogs.forEach(log => {
            let key: string;
            if (timeRange === 'year') {
                 key = new Date(new Date(log.timestamp).getFullYear(), new Date(log.timestamp).getMonth(), 1).toISOString().split('T')[0];
            } else {
                 key = new Date(log.timestamp).toISOString().split('T')[0];
            }
            groupedData[key] = (groupedData[key] || 0) + 1;
        });

        let start = new Date();
        if (timeRange === 'week') {
            const day = start.getDay();
            start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
            for (let i=0; i<7; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                dataPoints.push({ date: displayFormat(d), count: groupedData[d.toISOString().split('T')[0]] || 0 });
            }
        } else if (timeRange === 'month') {
            start.setDate(1);
            let end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dataPoints.push({ date: displayFormat(d), count: groupedData[d.toISOString().split('T')[0]] || 0 });
            }
        } else if (timeRange === 'year') {
            const year = new Date().getFullYear();
            for (let i = 0; i < 12; i++) {
                const d = new Date(year, i, 1);
                dataPoints.push({ date: displayFormat(d), count: groupedData[d.toISOString().split('T')[0]] || 0 });
            }
        } else { // ALL
             if (filteredLogs.length > 0) {
                const sorted = [...filteredLogs].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                let iter = new Date(sorted[0].timestamp);
                iter.setDate(1); iter.setHours(0,0,0,0);
                let maxDate = new Date(); maxDate.setDate(1); maxDate.setHours(0,0,0,0);
                while(iter <= maxDate) {
                    const count = filteredLogs.filter(l => { const logDate = new Date(l.timestamp); return logDate.getMonth() === iter.getMonth() && logDate.getFullYear() === iter.getFullYear(); }).length;
                    dataPoints.push({ date: displayFormat(iter), count });
                    iter.setMonth(iter.getMonth() + 1);
                }
            }
        }
    }
    
    return dataPoints;
  };

  const trendData = useMemo(() => generateTrendData(statsAnalysis.currentLogs, selectedTrendIssue), [statsAnalysis.currentLogs, timeRange, selectedTrendIssue]);
  
  const ncrTrendData = useMemo(() => {
    const ncrLogs = statsAnalysis.currentLogs.filter(l => l.status === IssueStatus.YES);
    return generateTrendData(ncrLogs, selectedNcrTrendIssue);
  }, [statsAnalysis.currentLogs, timeRange, selectedNcrTrendIssue]);

  // Create a filtered list of issue options that actually have NCRs
  const ncrIssueOptions = useMemo(() => {
    const ncrLogs = logs.filter(l => l.status === IssueStatus.YES);
    const uniqueNcrTypes = [...new Set(ncrLogs.map(l => l.type))];
    return issueOptions.filter(opt => uniqueNcrTypes.includes(opt.value));
  }, [logs, issueOptions]);

  const allOpenNcrs = useMemo(() => logs.filter(l => l.status === IssueStatus.YES && l.ncrStatus === NcrStatus.OPEN), [logs]);

  const issueBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {};
    statsAnalysis.currentLogs.forEach(l => { 
      counts[l.type] = (counts[l.type] || 0) + 1; 
    });
    
    return issueOptions
      .map(opt => ({ name: opt.label, value: opt.value, count: counts[opt.value] || 0, color: opt.color || '#94a3b8' }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [statsAnalysis.currentLogs, issueOptions]);
  
  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);
    
    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
        const now = new Date();
        
        let reportTitle = `Status Report: ${timeRange === 'all' ? 'All Time' : timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`;
        let dateRangeStr = new Date().toLocaleDateString();

        doc.setFontSize(22);
        doc.text(reportTitle, 20, 30);
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Generated on: ${dateRangeStr}`, 20, 45);

        const { currentLogs, previousLogs, showTrend } = statsAnalysis;
        let yPos = 60;
        
        const trendText = (diff: number) => diff > 0 ? `+${diff}` : `${diff}`;

        // 1. KPI Summary
        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Count', 'Trend']],
            body: [
                ['Total Issues', statsAnalysis.current.total, trendText(statsAnalysis.current.total - statsAnalysis.previous.total)],
                ['NCRs Raised', statsAnalysis.current.ncrCount, trendText(statsAnalysis.current.ncrCount - statsAnalysis.previous.ncrCount)],
                ['NCRs Closed', statsAnalysis.current.ncrClosed, trendText(statsAnalysis.current.ncrClosed - statsAnalysis.previous.ncrClosed)],
                ['Top Issue', statsAnalysis.current.topIssue, '']
            ],
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 20;

        // 2. Issue Performance Breakdown
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Issue Performance Breakdown", 20, yPos);
        yPos += 10;
        
        const issuePerformanceData = issueOptions.map(opt => {
            const currentCount = currentLogs.filter(l => l.type === opt.value).length;
            const prevCount = previousLogs.filter(l => l.type === opt.value).length;
            return { name: opt.label, current: currentCount, previous: prevCount, trend: currentCount - prevCount };
        }).filter(item => item.current > 0 || item.previous > 0);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Issue Type', 'Current Period', 'Previous Period', 'Trend']],
            body: issuePerformanceData.map(d => [d.name, d.current, d.previous, trendText(d.trend)]),
            theme: 'striped',
            headStyles: { fillColor: [45, 55, 72] },
            didParseCell: (data) => {
                if (data.column.index === 3 && data.cell.section === 'body' && showTrend) {
                    const diff = parseInt(String(data.cell.raw).replace('N/A', '0'));
                    if (diff > 0) data.cell.styles.textColor = [220, 38, 38];
                    else if (diff < 0) data.cell.styles.textColor = [22, 163, 74];
                }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 20;
        
        // 3. NCRs Raised This Period Table
        const ncrsThisPeriod = currentLogs.filter(l => l.status === IssueStatus.YES);

        if (ncrsThisPeriod.length > 0) {
            if (yPos > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); yPos = 20; }
            doc.setFontSize(14); doc.text(`NCRs Raised This Period (${ncrsThisPeriod.length})`, 20, yPos); yPos += 10;
            autoTable(doc, {
                startY: yPos,
                head: [['NCR #', 'Project', 'Issue Type', 'Date', 'Status', 'Resolution']],
                body: ncrsThisPeriod.map(ncr => [
                    ncr.ncrNumber || 'Pending',
                    ncr.project || '-',
                    ncr.type,
                    new Date(ncr.timestamp).toLocaleDateString(),
                    ncr.ncrStatus || 'Open',
                    ncr.ncrStatus === NcrStatus.CLOSED ? ncr.ncrResolution || '-' : '-'
                ]),
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] },
                didParseCell: (data) => {
                    if (data.column.index === 4 && data.cell.section === 'body' && ('' + data.cell.raw) === 'Closed') {
                        data.cell.styles.textColor = [22, 163, 74];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });
            yPos = (doc as any).lastAutoTable.finalY + 20;
        }
        
        const fileName = `Cures_Report_${now.toISOString().split('T')[0]}.pdf`;
        
        if (Capacitor.isNativePlatform()) {
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const result = await Filesystem.writeFile({ path: fileName, data: pdfBase64, directory: Directory.Cache });
            await Share.share({ title: reportTitle, text: `Attached: ${reportTitle}`, files: [result.uri] });
        } else {
            doc.save(fileName);
        }
    } catch (error) {
        console.error("Failed to generate report:", error);
        alert("Sorry, there was an error creating the report.");
    } finally {
        setIsGeneratingReport(false);
    }
  };

  const totalResolved = statsAnalysis.current.ncrClosed;
  const percentUseAsIs = totalResolved > 0 ? Math.round((statsAnalysis.current.resUseAsIs / totalResolved) * 100) : 0;
  const percentRework = totalResolved > 0 ? Math.round((statsAnalysis.current.resRework / totalResolved) * 100) : 0;
  const percentScrap = totalResolved > 0 ? Math.round((statsAnalysis.current.resScrap / totalResolved) * 100) : 0;
  
  const activeTrend = selectedTrendIssue === 'ALL'
    ? { label: 'All Issues', color: '#3b82f6' }
    : issueOptions.find(opt => opt.value === selectedTrendIssue) || { label: selectedTrendIssue, color: '#64748b' };
  
  const activeNcrTrend = selectedNcrTrendIssue === 'ALL'
    ? { label: 'All NCRs', color: '#ef4444' }
    : issueOptions.find(opt => opt.value === selectedNcrTrendIssue) || { label: selectedNcrTrendIssue, color: '#ef4444' };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
         <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto max-w-full no-scrollbar">
             <div className="px-2 flex items-center text-slate-400"><Filter className="w-4 h-4" /></div>
             {(['today', 'yesterday', 'week', 'month', 'year', 'all'] as TimeRange[]).map((range) => (
               <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize whitespace-nowrap ${timeRange === range ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>{range === 'all' ? 'All Time' : range === 'today' ? 'Today' : range === 'yesterday' ? 'Yesterday' : `This ${range}`}</button>
             ))}
         </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadReport} 
              disabled={isGeneratingReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              {isGeneratingReport ? <Loader className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {isGeneratingReport ? 'Generating...' : 'Download Report'}
            </button>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Key Performance Indicators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => onFilterRequest(undefined, undefined, timeRange)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group min-h-[140px]">
            <div className="flex justify-between items-start">
              <div><p className="text-slate-500 text-sm font-medium group-hover:text-blue-600">Total Issues</p><h3 className="text-3xl font-bold text-slate-800 mt-2">{statsAnalysis.current.total}</h3></div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-600"><Activity className="w-6 h-6" /></div>
            </div>
            <div className="flex items-center justify-between mt-4">
               <TrendBadge current={statsAnalysis.current.total} previous={statsAnalysis.previous.total} showTrend={statsAnalysis.showTrend} />
               <span className="text-xs text-slate-400 font-medium flex items-center gap-1 group-hover:text-blue-500">View List <ChevronRight className="w-3 h-3" /></span>
            </div>
          </div>
          <div onClick={() => onFilterRequest(undefined, IssueStatus.YES, timeRange)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group min-h-[140px]">
             <div className="flex justify-between items-start">
              <div className="w-full">
                <p className="text-slate-500 text-sm font-medium group-hover:text-orange-600">NCRs Raised</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{statsAnalysis.current.ncrCount}</h3>
                <div className="flex gap-3 mt-1 text-xs">
                    <span onClick={(e) => { e.stopPropagation(); onFilterRequest(undefined, IssueStatus.YES, timeRange, undefined, NcrStatus.OPEN); }} className="flex items-center gap-1 text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-red-100"><AlertCircle className="w-3 h-3" /> Open: {statsAnalysis.current.ncrOpen}</span>
                    <span onClick={(e) => { e.stopPropagation(); onFilterRequest(undefined, IssueStatus.YES, timeRange, undefined, NcrStatus.CLOSED); }} className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3" /> Closed: {statsAnalysis.current.ncrClosed}</span>
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-full text-orange-600"><AlertCircle className="w-6 h-6" /></div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-1 border-t border-slate-50">
               <TrendBadge current={statsAnalysis.current.ncrCount} previous={statsAnalysis.previous.ncrCount} showTrend={statsAnalysis.showTrend} />
               <span className="text-xs text-slate-400 font-medium flex items-center gap-1 group-hover:text-orange-500">View NCRs <ChevronRight className="w-3 h-3" /></span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between min-h-[140px]">
             <div className="flex justify-between items-start mb-2"><p className="text-slate-500 text-sm font-medium">Resolution Status</p><div className="p-1 bg-slate-50 rounded-full text-slate-400"><FileCheck className="w-4 h-4" /></div></div>
             <div className="space-y-2 mt-1">
                 <div onClick={() => onFilterRequest(undefined, IssueStatus.YES, timeRange, NcrResolution.USE_AS_IS)} className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 p-1 rounded group"><span className="flex items-center gap-1.5 text-blue-700 font-medium"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Use As-Is</span><span className="flex items-center gap-1"><span className="font-bold bg-blue-50 px-1.5 rounded">{statsAnalysis.current.resUseAsIs}</span><span className="text-slate-400 w-8 text-right">{percentUseAsIs}%</span></span></div>
                 <div onClick={() => onFilterRequest(undefined, IssueStatus.YES, timeRange, NcrResolution.REWORK)} className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 p-1 rounded group"><span className="flex items-center gap-1.5 text-amber-700 font-medium"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Rework</span><span className="flex items-center gap-1"><span className="font-bold bg-amber-50 px-1.5 rounded">{statsAnalysis.current.resRework}</span><span className="text-slate-400 w-8 text-right">{percentRework}%</span></span></div>
                 <div onClick={() => onFilterRequest(undefined, IssueStatus.YES, timeRange, NcrResolution.SCRAP)} className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 p-1 rounded group"><span className="flex items-center gap-1.5 text-red-700 font-medium"><span className="w-2 h-2 rounded-full bg-red-500"></span>Scrap</span><span className="flex items-center gap-1"><span className="font-bold bg-red-50 px-1.5 rounded">{statsAnalysis.current.resScrap}</span><span className="text-slate-400 w-8 text-right">{percentScrap}%</span></span></div>
             </div>
             <div className="mt-3 text-xs text-slate-400 text-center border-t border-slate-50 pt-1">Total Resolved: {totalResolved}</div>
          </div>
          <div onClick={() => statsAnalysis.current.topIssue !== 'None' ? onFilterRequest(statsAnalysis.current.topIssue, undefined, timeRange) : null} className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between group min-h-[140px] ${statsAnalysis.current.topIssue !== 'None' ? 'cursor-pointer hover:shadow-md hover:border-amber-200' : ''}`}>
             <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-2"><p className="text-slate-500 text-sm font-medium group-hover:text-amber-600">Most Frequent</p><h3 className="text-lg font-bold text-slate-800 mt-2 truncate" title={statsAnalysis.current.topIssue}>{statsAnalysis.current.topIssue}</h3><p className="text-xs text-slate-400 mt-1">{statsAnalysis.current.topIssueCount} occurrences</p></div>
              <div className="p-3 bg-amber-50 rounded-full text-amber-600 shrink-0"><TrendingUp className="w-6 h-6" /></div>
            </div>
            <div className="flex items-center justify-between mt-4">
               {statsAnalysis.current.topIssue !== 'None' ? (<TrendBadge current={statsAnalysis.current.topIssueCount} previous={statsAnalysis.prevTopIssueCount} showTrend={statsAnalysis.showTrend} />) : (<span></span>)}
               {statsAnalysis.current.topIssue !== 'None' && (<span className="text-xs text-slate-400 font-medium flex items-center gap-1 group-hover:text-amber-500">Filter <ChevronRight className="w-3 h-3" /></span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Issues Raised Trend
            </h3>
          </div>
          <div className="flex-shrink-0">
              <select 
                  value={selectedTrendIssue}
                  onChange={(e) => setSelectedTrendIssue(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                  <option value="ALL">All Issues</option>
                  {issueOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
              </select>
          </div>
        </div>
        <div className="h-80 w-full mt-4">
          <ResponsiveContainer><AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}><defs><linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={activeTrend.color} stopOpacity={0.1}/><stop offset="95%" stopColor={activeTrend.color} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }} labelStyle={{ fontWeight: 'bold', color: '#1e293b' }} cursor={{ stroke: activeTrend.color, strokeWidth: 1, strokeDasharray: '3 3' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" /><Area type="monotone" dataKey="count" stroke={activeTrend.color} fill="url(#colorTrend)" strokeWidth={2} name={activeTrend.label} dot={false} /></AreaChart></ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              NCRs Raised Trend
            </h3>
          </div>
          <div className="flex-shrink-0">
              <select 
                  value={selectedNcrTrendIssue}
                  onChange={(e) => setSelectedNcrTrendIssue(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg p-2 outline-none focus:ring-2 focus:ring-red-500"
              >
                  <option value="ALL">All NCRs</option>
                  {ncrIssueOptions.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))}
              </select>
          </div>
        </div>
        <div className="h-80 w-full mt-4">
          <ResponsiveContainer><AreaChart data={ncrTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}><defs><linearGradient id="colorNcrTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={activeNcrTrend.color} stopOpacity={0.1}/><stop offset="95%" stopColor={activeNcrTrend.color} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }} labelStyle={{ fontWeight: 'bold', color: '#1e293b' }} cursor={{ stroke: activeNcrTrend.color, strokeWidth: 1, strokeDasharray: '3 3' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" /><Area type="monotone" dataKey="count" stroke={activeNcrTrend.color} fill="url(#colorNcrTrend)" strokeWidth={2} name={activeNcrTrend.label} dot={false} /></AreaChart></ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Issue Breakdown ({timeRange === 'all' ? 'All Time' : `This ${timeRange}`})
        </h3>
        {issueBreakdownData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {issueBreakdownData.map(item => (
              <div key={item.value} onClick={() => onFilterRequest(item.value, undefined, timeRange)} className="bg-slate-50 border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all group">
                <div className="flex justify-between items-start"><p className="font-bold text-3xl text-slate-800">{item.count}</p><div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: item.color }}></div></div>
                <p className="text-sm font-medium text-slate-600 mt-1 truncate group-hover:text-blue-600">{item.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic">No issues recorded for this period.</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4"><AlertCircle className="w-5 h-5 text-red-600" /> Open Non-Conformance Reports</h3>
        {allOpenNcrs.length === 0 ? (
           <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-100"><CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" /><p className="text-slate-600 font-medium">No open NCRs pending action.</p></div>
        ) : (<div className="grid grid-cols-1 gap-3">{allOpenNcrs.map(ncr => (<div key={ncr.id} onClick={() => setSelectedNcr(ncr)} className="bg-white border border-red-100 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-red-300 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex-1 space-y-1"><div className="flex items-center gap-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">{ncr.ncrNumber || 'Missing NCR #'}</span><span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(ncr.timestamp).toLocaleDateString('en-US')}</span><span className="text-xs text-slate-500 font-medium">{ncr.plantNumber}</span></div><p className="font-medium text-slate-800">{ncr.type}</p><p className="text-sm text-slate-600 line-clamp-2">{ncr.notes}</p></div><div className="flex items-center gap-2"><span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100">Update / Close</span><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" /></div></div>))}</div>)}
      </div>
      
      <NcrActionModal isOpen={!!selectedNcr} onClose={() => setSelectedNcr(null)} log={selectedNcr} onUpdate={onUpdateLog} />
    </div>
  );
};

export default Dashboard;