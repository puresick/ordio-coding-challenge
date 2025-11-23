import { useShifts } from "@/context/ShiftsContext";
import type { Shift, Employee } from "@/context/ShiftsContext";
import { ShiftEditDialog } from "@/components/ShiftEditDialog";
import { ShiftCard, DraggableShiftCard } from "@/components/ShiftCard";
import { DndProvider } from "@/components/DndProvider";
import classes from "./CalendarView.module.css";

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
  const { shifts, loading, error } = useShifts();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const departments = [
    ...new Set(shifts.map((s) => s.branch_working_area.working_area.name)),
  ].toSorted((a, b) => a.localeCompare(b));

  const employees: Employee[] = [
    ...new Map(
      shifts
        .flatMap((s) => s.candidates.map((c) => c.employee))
        .filter((e) => e?.username)
        .map((e) => [e.id, e]),
    ).values(),
  ].toSorted((a, b) => a.username.localeCompare(b.username));

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

  return (
    <DndProvider>
      <section className={classes.block}>
        {WEEKDAYS.map((day) => (
          <h2 key={day}>{day}</h2>
        ))}
        <div className={classes.shifts}>
          {departments.map((dept: string) => (
            <div key={dept} className={classes.department}>
              {WEEKDAYS.map((day) => (
                <div key={day} className={classes.dayColumn}>
                  {shiftsByDepartmentAndDay[dept]?.[day]?.map((shift: Shift) => (
                    <DraggableShiftCard key={shift.id} shift={shift}>
                      <ShiftEditDialog
                        shift={shift}
                        employees={employees}
                        departments={departments}
                      >
                        <ShiftCard shift={shift} />
                      </ShiftEditDialog>
                    </DraggableShiftCard>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </DndProvider>
  );
}

export default CalendarView;
