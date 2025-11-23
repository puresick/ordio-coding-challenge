import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Types based on shifts.json structure
export interface Branch {
  id: number;
  name: string;
  enabled: boolean;
}

export interface WorkingArea {
  id: number;
  name: string;
  status: boolean;
}

export interface BranchWorkingArea {
  id: number;
  branch: Branch;
  working_area: WorkingArea;
  sort: number;
  status: boolean;
}

export interface Employee {
  id: string;
  user_id: string | null;
  email: string;
  employment: number;
  phone: string | null;
  company: unknown;
  username: string;
}

export interface Candidate {
  id: string;
  employee: Employee;
}

export interface TemplateConfig {
  shiftsPerDay: number;
  shiftLengthHours: number;
  selectedDays: string[];
  department: BranchWorkingArea;
}

export interface AddShiftConfig {
  department: BranchWorkingArea;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  employee?: Employee;
}

export interface TimeFrame {
  gte: string;
  lte: string;
}

export interface Tag {
  id: string;
  value: string;
  status: boolean;
  sort: number;
}

export interface ShiftTag {
  id: string;
  status: boolean;
  tag: Tag;
}

export interface Shift {
  id: string;
  type: string;
  start_tz: string;
  end_tz: string;
  working_time_in_minutes: number;
  time_frame: TimeFrame;
  timezone: string;
  employee_count: number;
  note: string;
  automatically_accept: boolean;
  canditature_system: boolean;
  pause: string;
  pause_paid: boolean;
  auto_break_rule: boolean;
  status: boolean;
  publish: boolean;
  branch_working_area: BranchWorkingArea;
  company_cost_centre: unknown;
  company_event: unknown;
  multi_checks: unknown;
  multi_check: unknown;
  candidates: Candidate[];
  shift_tags?: ShiftTag[];
}

// Context
interface ShiftsContextValue {
  shifts: Shift[];
  employees: Employee[];
  departments: BranchWorkingArea[];
  tags: Tag[];
  referenceDate: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  loadShifts: () => void;
  initializeEmpty: () => Promise<void>;
  purgeShifts: () => void;
  generateTemplate: (config: TemplateConfig) => void;
  addShift: (config: AddShiftConfig) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  updateShiftTags: (shiftId: string, tagIds: string[]) => void;
  assignEmployee: (shiftId: string, employee: Employee) => void;
  unassignEmployee: (shiftId: string) => void;
  swapShifts: (shiftId1: string, shiftId2: string) => void;
  moveShiftTo: (sourceShiftId: string, targetShiftId: string) => void;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  goToDate: (date: Date) => void;
}

const ShiftsContext = createContext<ShiftsContextValue | null>(null);

export function useShifts() {
  const context = useContext(ShiftsContext);
  if (!context) {
    throw new Error("useShifts must be used within a ShiftsProvider");
  }
  return context;
}

interface ShiftsProviderProps {
  children: ReactNode;
}

export function ShiftsProvider({ children }: ShiftsProviderProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<BranchWorkingArea[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [referenceDate, setReferenceDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const extractMetadataFromShifts = (data: Shift[]) => {
    // Extract unique employees from shifts
    const uniqueEmployees = [
      ...new Map(
        data
          .flatMap((s) => s.candidates.map((c) => c.employee))
          .filter((e) => e?.username)
          .map((e) => [e.id, e]),
      ).values(),
    ];

    // Extract unique departments from shifts
    const uniqueDepartments = [
      ...new Map(
        data.map((s) => [s.branch_working_area.id, s.branch_working_area]),
      ).values(),
    ];

    // Extract unique tags from shifts
    const uniqueTags = [
      ...new Map(
        data
          .flatMap((s) => s.shift_tags ?? [])
          .map((st) => [st.tag.id, st.tag]),
      ).values(),
    ].toSorted((a, b) => a.value.localeCompare(b.value));

    // Get reference date from first shift
    const refDate = data.length > 0 ? data[0].start_tz : null;

    return { uniqueEmployees, uniqueDepartments, uniqueTags, refDate };
  };

  const loadShifts = () => {
    setLoading(true);
    setError(null);
    fetch("/shifts.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch shifts: ${response.status}`);
        }
        return response.json();
      })
      .then((data: Shift[]) => {
        const { uniqueEmployees, uniqueDepartments, uniqueTags, refDate } =
          extractMetadataFromShifts(data);
        setShifts(data);
        setEmployees(uniqueEmployees);
        setDepartments(uniqueDepartments);
        setTags(uniqueTags);
        setReferenceDate(refDate);
        setLoading(false);
        setInitialized(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      });
  };

  const initializeEmpty = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/shifts.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch shifts: ${response.status}`);
      }
      const data: Shift[] = await response.json();
      const { uniqueEmployees, uniqueDepartments, uniqueTags, refDate } =
        extractMetadataFromShifts(data);

      setShifts([]); // Empty shifts
      setEmployees(uniqueEmployees);
      setDepartments(uniqueDepartments);
      setTags(uniqueTags);
      setReferenceDate(refDate);
      setLoading(false);
      setInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const purgeShifts = () => {
    setShifts([]);
  };

  const generateTemplate = async (config: TemplateConfig) => {
    const { shiftsPerDay, shiftLengthHours, selectedDays, department } = config;

    // Map day names to day indices (0 = Sunday, 1 = Monday, etc.)
    const dayIndices: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    // Hardcoded to week 17.11 - 23.11.2025 for demo purposes
    const nextMonday = new Date("2025-11-17");
    nextMonday.setHours(0, 0, 0, 0);

    const newShifts: Shift[] = [];

    for (const dayName of selectedDays) {
      const dayIndex = dayIndices[dayName];
      if (dayIndex === undefined) continue;

      // Calculate the date for this day
      const shiftDate = new Date(nextMonday);
      const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
      shiftDate.setDate(nextMonday.getDate() + daysFromMonday);

      // Create shifts for this day
      const startHour = 8; // Start at 8:00 AM
      for (let i = 0; i < shiftsPerDay; i++) {
        const shiftStartHour = startHour + i * shiftLengthHours;
        const shiftEndHour = shiftStartHour + shiftLengthHours;

        const startTime = new Date(shiftDate);
        startTime.setHours(shiftStartHour, 0, 0, 0);

        const endTime = new Date(shiftDate);
        endTime.setHours(shiftEndHour, 0, 0, 0);

        const formatDate = (date: Date) => date.toString();

        const shift: Shift = {
          id: crypto.randomUUID(),
          type: "shift",
          start_tz: formatDate(startTime),
          end_tz: formatDate(endTime),
          working_time_in_minutes: shiftLengthHours * 60,
          time_frame: {
            gte: formatDate(startTime),
            lte: formatDate(endTime),
          },
          timezone: "Europe/Berlin",
          employee_count: 1,
          note: "",
          automatically_accept: false,
          canditature_system: false,
          pause: "00:00",
          pause_paid: false,
          auto_break_rule: true,
          status: true,
          publish: true,
          branch_working_area: department,
          company_cost_centre: null,
          company_event: null,
          multi_checks: null,
          multi_check: null,
          candidates: [],
        };

        newShifts.push(shift);
      }
    }

    const response = await fetch("/shifts.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch shifts: ${response.status}`);
    }
    const data: Shift[] = await response.json();
    const { uniqueEmployees, uniqueDepartments, uniqueTags } =
      extractMetadataFromShifts(data);
    setDepartments(uniqueDepartments);
    setTags(uniqueTags);

    setShifts((prev) => [
      // Keep shifts from other departments
      ...prev.filter((s) => s.branch_working_area.id !== department.id),
      // Add new template shifts for selected department
      ...newShifts,
    ]);
    setEmployees(uniqueEmployees);
    setReferenceDate(nextMonday.toISOString());
    setInitialized(true);
  };

  const addShift = (config: AddShiftConfig) => {
    const { department, date, startTime, endTime, employee } = config;

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startDate = new Date(date);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMin, 0, 0);

    const formatDate = (d: Date) => d.toString();

    const workingTimeMinutes =
      endHour * 60 + endMin - (startHour * 60 + startMin);

    const candidates: Candidate[] = employee
      ? [{ id: crypto.randomUUID(), employee }]
      : [];

    const newShift: Shift = {
      id: crypto.randomUUID(),
      type: "shift",
      start_tz: formatDate(startDate),
      end_tz: formatDate(endDate),
      working_time_in_minutes: workingTimeMinutes,
      time_frame: {
        gte: formatDate(startDate),
        lte: formatDate(endDate),
      },
      timezone: "Europe/Berlin",
      employee_count: 1,
      note: "",
      automatically_accept: false,
      canditature_system: false,
      pause: "00:00",
      pause_paid: false,
      auto_break_rule: true,
      status: true,
      publish: true,
      branch_working_area: department,
      company_cost_centre: null,
      company_event: null,
      multi_checks: null,
      multi_check: null,
      candidates,
    };

    setShifts((prev) => [...prev, newShift]);
  };

  const updateShift = (shiftId: string, updates: Partial<Shift>) => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === shiftId ? { ...shift, ...updates } : shift,
      ),
    );
  };

  const updateShiftTags = (shiftId: string, tagIds: string[]) => {
    setShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;

        const newShiftTags: ShiftTag[] = tagIds.map((tagId) => {
          const tag = tags.find((t) => t.id === tagId);
          if (!tag) throw new Error(`Tag with id ${tagId} not found`);
          return {
            id: crypto.randomUUID(),
            status: true,
            tag,
          };
        });

        return {
          ...shift,
          shift_tags: newShiftTags,
        };
      }),
    );
  };

  const assignEmployee = (shiftId: string, employee: Employee) => {
    setShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;

        const newCandidate: Candidate = {
          id: crypto.randomUUID(),
          employee,
        };

        return {
          ...shift,
          candidates: [newCandidate, ...shift.candidates.slice(1)],
        };
      }),
    );
  };

  const unassignEmployee = (shiftId: string) => {
    setShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;

        return {
          ...shift,
          candidates: shift.candidates.slice(1),
        };
      }),
    );
  };

  const swapShifts = (shiftId1: string, shiftId2: string) => {
    setShifts((prev) => {
      const shift1 = prev.find((s) => s.id === shiftId1);
      const shift2 = prev.find((s) => s.id === shiftId2);

      if (!shift1 || !shift2) return prev;

      return prev.map((shift) => {
        if (shift.id === shiftId1) {
          // Swap only the employees, keep date/time/department
          return {
            ...shift,
            candidates: shift2.candidates,
          };
        }
        if (shift.id === shiftId2) {
          // Swap only the employees, keep date/time/department
          return {
            ...shift,
            candidates: shift1.candidates,
          };
        }
        return shift;
      });
    });
  };

  const moveShiftTo = (sourceShiftId: string, targetShiftId: string) => {
    setShifts((prev) => {
      const sourceShift = prev.find((s) => s.id === sourceShiftId);
      const targetShift = prev.find((s) => s.id === targetShiftId);

      if (!sourceShift || !targetShift) return prev;

      return prev.map((shift) => {
        if (shift.id === sourceShiftId) {
          // Source becomes unassigned but keeps its date/time/department
          return {
            ...shift,
            candidates: [],
          };
        }
        if (shift.id === targetShiftId) {
          // Target gets source's employee but keeps its date/time/department
          return {
            ...shift,
            candidates: sourceShift.candidates,
          };
        }
        return shift;
      });
    });
  };

  const goToPreviousWeek = () => {
    setReferenceDate((prev) => {
      if (!prev) return prev;
      const date = new Date(prev);
      date.setDate(date.getDate() - 7);
      return date.toISOString();
    });
  };

  const goToNextWeek = () => {
    setReferenceDate((prev) => {
      if (!prev) return prev;
      const date = new Date(prev);
      date.setDate(date.getDate() + 7);
      return date.toISOString();
    });
  };

  const goToCurrentWeek = () => {
    // Hardcoded to week 17.11 - 23.11.2025 due to demo data only having data for that particular week
    setReferenceDate(new Date("2025-11-17").toISOString());
  };

  const goToDate = (date: Date) => {
    setReferenceDate(date.toISOString());
  };

  return (
    <ShiftsContext.Provider
      value={{
        shifts,
        employees,
        departments,
        tags,
        referenceDate,
        loading,
        error,
        initialized,
        loadShifts,
        initializeEmpty,
        purgeShifts,
        generateTemplate,
        addShift,
        updateShift,
        updateShiftTags,
        assignEmployee,
        unassignEmployee,
        swapShifts,
        moveShiftTo,
        goToPreviousWeek,
        goToNextWeek,
        goToCurrentWeek,
        goToDate,
      }}
    >
      {children}
    </ShiftsContext.Provider>
  );
}
