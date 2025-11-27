
import { IssueType, PlantNumber, IssueStatus, IssueLog, NcrStatus, NcrResolution, WeeklySchedule } from './types';

export const ISSUE_OPTIONS = [
  { value: IssueType.FAULTY_TCS, label: "Faulty TC's", color: "#f87171" }, // Red
  { value: IssueType.BAG_FAILURE, label: "Bag Failure", color: "#fb923c" },  // Orange
  { value: IssueType.LOCK_OFF, label: "Lock Off", color: "#facc15" }, // Yellow
  { value: IssueType.OUTLIFE, label: "Outlife", color: "#a855f7" }, // Purple
  { value: IssueType.EQUIPMENT_FAILURE, label: "Equipment Failure", color: "#94a3b8" }, // Slate
  { value: IssueType.OPERATOR_ERROR, label: "Operator Error", color: "#60a5fa" } // Blue
];

// FIX: Added 'color' property to each plant option for use in the schedule view.
export const PLANT_OPTIONS = [
  { value: PlantNumber.AUTOCLAVE_PL098, label: "Autoclave PL098", color: "#3b82f6" }, // Blue
  { value: PlantNumber.AUTOCLAVE_PL060, label: "Autoclave PL060", color: "#16a34a" }, // Green
  { value: PlantNumber.AUTOCLAVE_PL400, label: "Autoclave PL400", color: "#ca8a04" }, // Yellow
  { value: PlantNumber.OVEN_PL016, label: "Oven PL016", color: "#ea580c" }, // Orange
  { value: PlantNumber.OVEN_PL290, label: "Oven PL290", color: "#db2777" }, // Pink
  { value: PlantNumber.OVEN_PL064, label: "Oven PL064", color: "#7c3aed" }, // Violet
  { value: PlantNumber.OVEN_PL401, label: "Oven PL401", color: "#14b8a6" }, // Teal
  { value: PlantNumber.PL141, label: "PL141", color: "#64748b" } // Slate
];

export const PROJECT_OPTIONS = [
  { value: "Camm", label: "Camm" },
  { value: "Lockheed", label: "Lockheed" },
  { value: "Plenums", label: "Plenums" },
  { value: "Pall", label: "Pall" },
  { value: "H175", label: "H175" },
  { value: "Carousel", label: "Carousel" },
  { value: "Camm Details", label: "Camm Details" },
  { value: "EFA", label: "EFA" },
  { value: "Spinners", label: "Spinners" },
  { value: "Marine", label: "Marine" },
  { value: "NPI", label: "NPI" }
];

export const STATUS_OPTIONS = [
  { value: IssueStatus.YES, label: "Yes" },
  { value: IssueStatus.NO, label: "No" }
];

export const NCR_STATUS_OPTIONS = [
  { value: NcrStatus.OPEN, label: "Open" },
  { value: NcrStatus.CLOSED, label: "Closed" }
];

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Generator for random test data
export const generateMockData = (count: number): IssueLog[] => {
  const data: IssueLog[] = [];
  const now = new Date();
  
  const types = Object.values(IssueType);
  const plants = PLANT_OPTIONS.map(p => p.value);
  const projects = PROJECT_OPTIONS.map(p => p.value);
  const resolutions = Object.values(NcrResolution);

  for (let i = 0; i < count; i++) {
    const isNcr = Math.random() < 0.3;
    const status = isNcr ? IssueStatus.YES : IssueStatus.NO;
    const daysBack = Math.floor(Math.random() * 365); 
    const date = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    date.setHours(Math.floor(6 + Math.random() * 16), Math.floor(Math.random() * 60));

    const type = types[Math.floor(Math.random() * types.length)];
    const plant = plants[Math.floor(Math.random() * plants.length)];
    const project = projects[Math.floor(Math.random() * projects.length)];

    let ncrNumber: string | undefined = undefined;
    let ncrStatus: NcrStatus | undefined = undefined;
    let ncrRaisedTimestamp: string | undefined = undefined;
    let ncrResolution: NcrResolution | undefined = undefined;

    if (isNcr) {
      ncrRaisedTimestamp = date.toISOString();
      const hasNcrNumber = Math.random() > 0.2;
      if (hasNcrNumber) {
        ncrNumber = `NCR-${date.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const isClosed = Math.random() > 0.4 || daysBack > 60;
        if (isClosed) {
          ncrStatus = NcrStatus.CLOSED;
          ncrResolution = resolutions[Math.floor(Math.random() * resolutions.length)];
        } else {
          ncrStatus = NcrStatus.OPEN;
        }
      } else {
        ncrStatus = NcrStatus.OPEN;
      }
    }

    data.push({
      // FIX: Standardized ID generation to 9 characters for consistency.
      id: Math.random().toString(36).substring(2, 11),
      type: type,
      plantNumber: plant,
      project: project,
      status: status,
      timestamp: date.toISOString(),
      notes: `Test entry #${i + 1}: Simulated data log for ${type}.`,
      cureCycleNumber: `CC-${date.getFullYear()}-${String(1000 + i).slice(-4)}`,
      ncrNumber: ncrNumber,
      ncrStatus: ncrStatus,
      ncrRaisedTimestamp: ncrRaisedTimestamp,
      ncrResolution: ncrResolution
    });
  }
  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const generateMockScheduleData = (): WeeklySchedule => {
  const schedule: WeeklySchedule = {};
  const now = new Date();
  const sampleTasks = ['Production Run', 'Tool Prep', 'Maintenance', 'Cleaning', 'Setup: Camm', 'Setup: Lockheed', 'Cure Cycle #1234'];

  // Generate for -30 to +30 days from today
  for (let i = -30; i < 30; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = date.getDay(); // Sunday = 0, Saturday = 6

    PLANT_OPTIONS.forEach(plant => {
      // Higher chance of tasks on weekdays
      const shouldSchedule = dayOfWeek > 0 && dayOfWeek < 6 ? Math.random() < 0.8 : Math.random() < 0.3;
      
      if (shouldSchedule) {
        const key = `${plant.value}-${dateString}`;
        schedule[key] = { AM: '', PM: '' };

        // Schedule AM shift?
        if (Math.random() < 0.9) {
          schedule[key].AM = sampleTasks[Math.floor(Math.random() * sampleTasks.length)];
        }
        // Schedule PM shift?
        if (Math.random() < 0.7) {
          schedule[key].PM = sampleTasks[Math.floor(Math.random() * sampleTasks.length)];
        }

        // If both are empty after random checks, remove the entry
        if (!schedule[key].AM && !schedule[key].PM) {
          delete schedule[key];
        }
      }
    });
  }

  return schedule;
};

export const MOCK_DATA = generateMockData(200);