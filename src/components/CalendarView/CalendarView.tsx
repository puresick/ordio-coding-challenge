import { useShifts } from "@/context/ShiftsContext";
import type { Shift } from "@/context/ShiftsContext";
import { ShiftEditDialog } from "@/components/ShiftEditDialog";
import { ShiftCard, DraggableShiftCard } from "@/components/ShiftCard";
import { DndProvider } from "@/components/DndProvider";
import classes from "./CalendarView.module.css";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function getWeekdayFromDateString(dateString: string): string {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });

  return weekday.toLowerCase();
}

function CalendarView() {
  const { shifts, employees, departments, referenceDate, loading, error } =
    useShifts();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // Get sorted department names for display (from departments, not shifts)
  const departmentNames = departments
    .map((d) => d.working_area.name)
    .toSorted((a, b) => a.localeCompare(b));

  // Calculate week boundaries from referenceDate
  const datesByWeekday: Record<string, Date> = {};
  let weekStart: Date | null = null;
  let weekEnd: Date | null = null;

  if (referenceDate) {
    const refDate = new Date(referenceDate);
    const dayOfWeek = refDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate Monday of this week
    const monday = new Date(refDate);
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(refDate.getDate() + daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    // Calculate Sunday (end of week)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    weekStart = monday;
    weekEnd = sunday;

    // Generate dates for all weekdays
    WEEKDAYS.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      datesByWeekday[day] = date;
    });
  }

  // Filter shifts to only show those in the current week
  const shiftsInCurrentWeek = shifts.filter((shift) => {
    if (!weekStart || !weekEnd) return true;
    const shiftDate = new Date(shift.start_tz);
    return shiftDate >= weekStart && shiftDate <= weekEnd;
  });

  const shiftsByDepartmentAndDay = shiftsInCurrentWeek.reduce<
    Record<string, Record<string, Shift[]>>
  >((acc, shift) => {
    const dept = shift.branch_working_area.working_area.name;
    const weekday = getWeekdayFromDateString(shift.start_tz);

    if (!acc[dept]) {
      acc[dept] = {};
    }

    if (!acc[dept][weekday]) {
      acc[dept][weekday] = [];
    }

    acc[dept][weekday].push(shift);

    return acc;
  }, {});

  // Sort shifts within each department/day by start time
  for (const dept of Object.keys(shiftsByDepartmentAndDay)) {
    for (const day of Object.keys(shiftsByDepartmentAndDay[dept])) {
      shiftsByDepartmentAndDay[dept][day].sort(
        (a, b) =>
          new Date(a.start_tz).getTime() - new Date(b.start_tz).getTime(),
      );
    }
  }

  return (
    <DndProvider>
      <section className={classes.block}>
        <div className={classes.weekdays}>
          {WEEKDAYS.map((day) => (
            <h2 key={day}>
              {day}
              {datesByWeekday[day] && (
                <span className={classes.date}>
                  {datesByWeekday[day].toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </h2>
          ))}
        </div>
        <div className={classes.shifts}>
          {departmentNames.map((deptName: string) => (
            <div key={deptName} className={classes.department}>
              <h3 className={classes.departmentHeader}>{deptName}</h3>
              <div className={classes.departmentShifts}>
                {WEEKDAYS.map((day) => {
                  const departmentForDay = departments.find(
                    (d) => d.working_area.name === deptName,
                  );
                  return (
                    <div key={day} className={classes.dayColumn}>
                      {shiftsByDepartmentAndDay[deptName]?.[day]?.map(
                        (shift: Shift) => (
                          <DraggableShiftCard key={shift.id} shift={shift}>
                            <ShiftEditDialog
                              shift={shift}
                              employees={employees}
                              departments={departments}
                            >
                              <ShiftCard shift={shift} />
                            </ShiftEditDialog>
                          </DraggableShiftCard>
                        ),
                      )}
                      <ShiftEditDialog
                        employees={employees}
                        departments={departments}
                        defaultDay={day}
                        defaultDepartment={departmentForDay}
                      >
                        <Button className={classes.addShift}>
                          <Plus />
                          Add Shift
                        </Button>
                      </ShiftEditDialog>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </DndProvider>
  );
}

export default CalendarView;
