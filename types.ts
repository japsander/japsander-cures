
export enum IssueType {
  FAULTY_TCS = "Faulty TC's",
  BAG_FAILURE = "Bag Failure",
  LOCK_OFF = "Lock Off",
  OUTLIFE = "Outlife",
  EQUIPMENT_FAILURE = "Equipment Failure",
  OPERATOR_ERROR = "Operator Error"
}

export enum PlantNumber {
  AUTOCLAVE_PL098 = "autoclave PL098",
  AUTOCLAVE_PL060 = "autoclave PL060",
  AUTOCLAVE_PL400 = "autoclave PL400",
  OVEN_PL016 = "oven PL016",
  OVEN_PL290 = "oven PL290",
  OVEN_PL064 = "oven PL064",
  OVEN_PL401 = "oven PL401",
  PL141 = "PL141"
}

export enum IssueStatus {
  YES = "Yes",
  NO = "No"
}

export enum NcrStatus {
  OPEN = "Open",
  CLOSED = "Closed"
}

export enum NcrResolution {
  USE_AS_IS = "Use As-Is",
  SCRAP = "Scrap",
  REWORK = "Rework"
}

export interface OptionItem {
  value: string;
  label: string;
  color?: string; // For issue types
}

export interface IssueLog {
  id: string;
  type: string; 
  plantNumber: string; 
  project: string; 
  status: IssueStatus; 
  timestamp: string; // ISO string
  notes: string;
  cureCycleNumber: string; 
  ncrNumber?: string; 
  ncrStatus?: NcrStatus;
  ncrRaisedTimestamp?: string;
  ncrResolution?: NcrResolution;
}

export interface DashboardStats {
  totalIssues: number;
  topIssue: string;
  ncrIssues: number; 
}

export interface WeeklySchedule {
  [day: string]: {
    AM: string;
    PM: string;
    amCompleted?: boolean;
    pmCompleted?: boolean;
  }
}

export interface OutlifeItem {
  id: string;
  name: string;
  batchNumber: string;
  totalOutlifeHours: number;
  exposureHistory: { start: number; end: number | null }[]; // Timestamps
  status: 'Stored' | 'In Use';
  createdAt: number;
}

export interface MemorableDate {
  id: string;
  date: string; // YYYY-MM-DD string
  description: string;
}
