import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useShifts } from "@/context/ShiftsContext";
import type { Shift, Employee, BranchWorkingArea } from "@/context/ShiftsContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface ShiftEditDialogProps {
  shift?: Shift;
  employees: Employee[];
  departments: BranchWorkingArea[];
  defaultDay?: string;
  defaultDepartment?: BranchWorkingArea;
  children?: React.ReactNode;
}

function formatTimeForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getWeekdayFromDateString(dateString: string): string {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  return weekday.toLowerCase();
}

export function ShiftEditDialog({
  shift,
  employees,
  departments,
  defaultDay,
  defaultDepartment,
  children,
}: ShiftEditDialogProps) {
  const { shifts, referenceDate, assignEmployee, unassignEmployee, updateShift, addShift } = useShifts();

  const isAddMode = !shift;
  const currentEmployee = shift?.candidates[0]?.employee;
  const currentDepartment = shift?.branch_working_area;
  const currentDay = shift ? getWeekdayFromDateString(shift.start_tz) : (defaultDay ?? "monday");
  const isUnassigned = !currentEmployee?.username;

  const [open, setOpen] = useState(false);

  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    currentEmployee?.id ?? "",
  );

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<BranchWorkingArea | null>(currentDepartment ?? defaultDepartment ?? null);

  const [dayOpen, setDayOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(currentDay);

  const [startTime, setStartTime] = useState(
    shift ? formatTimeForInput(shift.start_tz) : "09:00"
  );
  const [endTime, setEndTime] = useState(
    shift ? formatTimeForInput(shift.end_tz) : "17:00"
  );

  // Calculate date for selected day based on existing shifts or referenceDate
  const getDateForDay = (day: string): Date => {
    const refDateString = shifts.length > 0 ? shifts[0].start_tz : referenceDate;

    if (refDateString) {
      const refDate = new Date(refDateString);
      const dayOfWeek = refDate.getDay();
      const monday = new Date(refDate);
      const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setDate(refDate.getDate() + daysFromMonday);
      monday.setHours(0, 0, 0, 0);

      const dayIndex = WEEKDAYS.indexOf(day);
      const date = new Date(monday);
      date.setDate(monday.getDate() + dayIndex);
      return date;
    }

    // Default to hardcoded demo week 17.11 - 23.11.2025
    const monday = new Date("2025-11-17");
    monday.setHours(0, 0, 0, 0);
    const dayIndex = WEEKDAYS.indexOf(day);
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    return date;
  };

  const handleSave = () => {
    const employee = employees.find((e) => e.id === selectedEmployee);

    if (isAddMode) {
      if (!selectedDepartment) return;

      const date = getDateForDay(selectedDay);
      addShift({
        department: selectedDepartment,
        date,
        startTime,
        endTime,
        employee,
      });

      // Reset form
      setSelectedEmployee("");
      setSelectedDepartment(null);
      setSelectedDay("monday");
      setStartTime("09:00");
      setEndTime("17:00");
    } else if (shift) {
      if (isUnassigned) {
        if (employee) {
          assignEmployee(shift.id, employee);
        }
      } else {
        // Update employee if changed
        if (employee && employee.id !== currentEmployee?.id) {
          assignEmployee(shift.id, employee);
        }

        // Update times
        const currentDate = new Date(shift.start_tz);
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const newStartDate = new Date(currentDate);
        newStartDate.setHours(startHour, startMin, 0, 0);

        const newEndDate = new Date(currentDate);
        newEndDate.setHours(endHour, endMin, 0, 0);

        updateShift(shift.id, {
          start_tz: newStartDate.toString(),
          end_tz: newEndDate.toString(),
        });
      }
    }
    setOpen(false);
  };

  const handleUnassign = () => {
    if (shift) {
      unassignEmployee(shift.id);
    }
    setOpen(false);
  };

  const getDialogTitle = () => {
    if (isAddMode) return "Add New Shift";
    if (isUnassigned) return "Assign Shift";
    return "Edit Shift";
  };

  const getDialogDescription = () => {
    if (isAddMode) return "Create a new shift. Leave employee empty for an unassigned shift.";
    if (isUnassigned) return "Select an employee to assign to this shift.";
    return "Update the shift details below. Click save when you're done.";
  };

  const getSubmitLabel = () => {
    if (isAddMode) return "Add Shift";
    if (isUnassigned) return "Assign";
    return "Save changes";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Add Shift
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {(isAddMode || !isUnassigned) && (
            <>
              {/* Department Combobox */}
              <div className="grid gap-2">
                <Label>Department {isAddMode && "*"}</Label>
                <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={departmentOpen}
                      className="justify-between"
                    >
                      {selectedDepartment?.working_area.name || "Select department..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search department..." />
                      <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup>
                          {departments
                            .toSorted((a, b) => a.working_area.name.localeCompare(b.working_area.name))
                            .map((dept) => (
                              <CommandItem
                                key={dept.id}
                                value={dept.working_area.name}
                                onSelect={() => {
                                  setSelectedDepartment(dept);
                                  setDepartmentOpen(false);
                                }}
                              >
                                {dept.working_area.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    selectedDepartment?.id === dept.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Day Combobox */}
              <div className="grid gap-2">
                <Label>Day {isAddMode && "*"}</Label>
                <Popover open={dayOpen} onOpenChange={setDayOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dayOpen}
                      className="justify-between capitalize"
                    >
                      {selectedDay || "Select day..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search day..." />
                      <CommandList>
                        <CommandEmpty>No day found.</CommandEmpty>
                        <CommandGroup>
                          {WEEKDAYS.map((day) => (
                            <CommandItem
                              key={day}
                              value={day}
                              onSelect={(value) => {
                                setSelectedDay(value);
                                setDayOpen(false);
                              }}
                            >
                              <span className="capitalize">{day}</span>
                              <Check
                                className={cn(
                                  "ml-auto",
                                  selectedDay === day ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-time">Start Time {isAddMode && "*"}</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-time">End Time {isAddMode && "*"}</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Employee Combobox */}
          <div className="grid gap-2">
            <Label>Employee {isAddMode && "(optional)"}</Label>
            <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={employeeOpen}
                  className="justify-between"
                >
                  {selectedEmployee
                    ? employees.find((e) => e.id === selectedEmployee)?.username
                    : isAddMode ? "Unassigned" : "Select employee..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search employee..." />
                  <CommandList>
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      {isAddMode && (
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setSelectedEmployee("");
                            setEmployeeOpen(false);
                          }}
                        >
                          Unassigned
                          <Check
                            className={cn(
                              "ml-auto",
                              selectedEmployee === "" ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      )}
                      {employees
                        .toSorted((a, b) => a.username.localeCompare(b.username))
                        .map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.username}
                            onSelect={() => {
                              setSelectedEmployee(employee.id);
                              setEmployeeOpen(false);
                            }}
                          >
                            {employee.username}
                            <Check
                              className={cn(
                                "ml-auto",
                                selectedEmployee === employee.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          {!isAddMode && !isUnassigned && (
            <Button variant="destructive" className="mr-auto" onClick={handleUnassign}>
              Unassign
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isAddMode && !selectedDepartment}>
            {getSubmitLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShiftEditDialog;
