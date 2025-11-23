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

  // Get sorted department names for display
  const departmentNames = [
    ...new Set(shifts.map((s) => s.branch_working_area.working_area.name)),
  ].toSorted((a, b) => a.localeCompare(b));

  const shiftsByDepartmentAndDay = shifts.reduce<
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

  // Extract date for each weekday from shifts or referenceDate
  const datesByWeekday: Record<string, Date> = {};

  // Use shifts[0] if available, otherwise fall back to referenceDate from context
  const refDateString = shifts.length > 0 ? shifts[0].start_tz : referenceDate;

  if (refDateString) {
    const refDate = new Date(refDateString);
    const dayOfWeek = refDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate Monday of this week
    const monday = new Date(refDate);
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(refDate.getDate() + daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    // Generate dates for all weekdays
    WEEKDAYS.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      datesByWeekday[day] = date;
    });
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
                          <Plus className="h-4 w-4" />
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
