import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, AlertTriangle } from "lucide-react";
import { useShifts } from "@/context/ShiftsContext";
import type { Shift, BranchWorkingArea } from "@/context/ShiftsContext";
import { WEEKDAYS, type Weekday } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import classes from "./ShiftEditDialog.module.css";

interface ShiftEditDialogProps {
  shift?: Shift;
  defaultDay?: Weekday;
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

function getWeekdayFromDateString(dateString: string): Weekday {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  return weekday.toLowerCase() as Weekday;
}

export function ShiftEditDialog({
  shift,
  defaultDay,
  defaultDepartment,
  children,
}: ShiftEditDialogProps) {
  const {
    shifts,
    employees,
    departments,
    referenceDate,
    tags,
    assignEmployee,
    unassignEmployee,
    updateShift,
    updateShiftTags,
    addShift,
  } = useShifts();

  const isAddMode = !shift;
  const currentEmployee = shift?.candidates[0]?.employee;
  const currentDepartment = shift?.branch_working_area;
  const currentDay = shift
    ? getWeekdayFromDateString(shift.start_tz)
    : (defaultDay ?? "monday");
  const isUnassigned = !currentEmployee?.username;

  const [open, setOpen] = useState(false);

  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    currentEmployee?.id ?? "",
  );

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<BranchWorkingArea | null>(
      currentDepartment ?? defaultDepartment ?? null,
    );

  const [dayOpen, setDayOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Weekday>(currentDay);

  const [startTime, setStartTime] = useState(
    shift ? formatTimeForInput(shift.start_tz) : "09:00",
  );
  const [endTime, setEndTime] = useState(
    shift ? formatTimeForInput(shift.end_tz) : "17:00",
  );

  const [tagsOpen, setTagsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    shift?.shift_tags?.map((st) => st.tag.id) ?? [],
  );

  // Check if selected times violate underage work restrictions (before 06:00 or after 20:00)
  const isUnderageRestrictedTime = useMemo(() => {
    const [startHour] = startTime.split(":").map(Number);
    const [endHour] = endTime.split(":").map(Number);
    return startHour < 6 || endHour > 20;
  }, [startTime, endTime]);

  // Filter employees: exclude underage employees when time restrictions apply
  const { availableEmployees, excludedUnderageEmployees } = useMemo(() => {
    const underage = employees.filter((e) => e.is_underage);
    const available = isUnderageRestrictedTime
      ? employees.filter((e) => !e.is_underage)
      : employees;
    const excluded = isUnderageRestrictedTime ? underage : [];
    return {
      availableEmployees: available,
      excludedUnderageEmployees: excluded,
    };
  }, [employees, isUnderageRestrictedTime]);

  // Memoize sorted departments
  const sortedDepartments = useMemo(
    () =>
      departments.toSorted((a, b) =>
        a.working_area.name.localeCompare(b.working_area.name),
      ),
    [departments],
  );

  // Memoize sorted employees
  const sortedAvailableEmployees = useMemo(
    () => availableEmployees.toSorted((a, b) => a.username.localeCompare(b.username)),
    [availableEmployees],
  );

  // Validate time range (end must be after start)
  const isTimeRangeValid = useMemo(() => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  }, [startTime, endTime]);

  // Handle dialog open/close and reset form when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedEmployee(currentEmployee?.id ?? "");
      setSelectedDepartment(currentDepartment ?? defaultDepartment ?? null);
      setSelectedDay(currentDay);
      setStartTime(shift ? formatTimeForInput(shift.start_tz) : "09:00");
      setEndTime(shift ? formatTimeForInput(shift.end_tz) : "17:00");
      setSelectedTags(shift?.shift_tags?.map((st) => st.tag.id) ?? []);
    }
    setOpen(newOpen);
  };

  // Calculate date for selected day based on existing shifts or referenceDate
  const getDateForDay = (day: Weekday): Date => {
    const refDateString =
      shifts.length > 0 ? shifts[0].start_tz : referenceDate;

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
      setSelectedTags([]);
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

      // Update tags
      const currentTagIds = shift.shift_tags?.map((st) => st.tag.id) ?? [];
      const tagsChanged =
        selectedTags.length !== currentTagIds.length ||
        selectedTags.some((id) => !currentTagIds.includes(id));
      if (tagsChanged) {
        updateShiftTags(shift.id, selectedTags);
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
    if (isAddMode)
      return "Create a new shift. Leave employee empty for an unassigned shift.";
    if (isUnassigned) return "Select an employee to assign to this shift.";
    return "Update the shift details below. Click save when you're done.";
  };

  const getSubmitLabel = () => {
    if (isAddMode) return "Add Shift";
    if (isUnassigned) return "Assign";
    return "Save changes";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus />
            Add Shift
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={classes.dialogContent}>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className={classes.formGrid}>
          {(isAddMode || !isUnassigned) && (
            <>
              {/* Department Combobox */}
              <div className={classes.formRow}>
                <Label>Department {isAddMode && "*"}</Label>
                <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={departmentOpen}
                      className={classes.comboboxTrigger}
                    >
                      {selectedDepartment?.working_area.name ||
                        "Select department..."}
                      <ChevronsUpDown className={classes.comboboxIcon} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={classes.popoverContent}>
                    <Command>
                      <CommandInput placeholder="Search department..." />
                      <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup>
                          {sortedDepartments.map((dept) => (
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
                                    classes.checkIcon,
                                    selectedDepartment?.id === dept.id
                                      ? classes.checkIconVisible
                                      : classes.checkIconHidden,
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
              <div className={classes.formRow}>
                <Label>Day {isAddMode && "*"}</Label>
                <Popover open={dayOpen} onOpenChange={setDayOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dayOpen}
                      className={classes.comboboxTriggerCapitalize}
                    >
                      {selectedDay || "Select day..."}
                      <ChevronsUpDown className={classes.comboboxIcon} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className={classes.popoverContent}>
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
                                setSelectedDay(value as Weekday);
                                setDayOpen(false);
                              }}
                            >
                              <span className={classes.capitalize}>{day}</span>
                              <Check
                                className={cn(
                                  classes.checkIcon,
                                  selectedDay === day
                                    ? classes.checkIconVisible
                                    : classes.checkIconHidden,
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
              <div className={classes.formRow}>
                <div className={classes.timeRow}>
                  <div className={classes.formRow}>
                    <Label htmlFor="start-time">
                      Start Time {isAddMode && "*"}
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className={classes.formRow}>
                    <Label htmlFor="end-time">End Time {isAddMode && "*"}</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
                {!isTimeRangeValid && (
                  <p className={classes.errorText}>
                    End time must be after start time.
                  </p>
                )}
              </div>
            </>
          )}

          {/* Employee Combobox */}
          <div className={classes.formRow}>
            <Label>Employee {isAddMode && "(optional)"}</Label>
            <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={employeeOpen}
                  className={classes.comboboxTrigger}
                >
                  {selectedEmployee
                    ? availableEmployees.find((e) => e.id === selectedEmployee)
                        ?.username
                    : isAddMode
                      ? "Unassigned"
                      : "Select employee..."}
                  <ChevronsUpDown className={classes.comboboxIcon} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className={classes.popoverContent}>
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
                              classes.checkIcon,
                              selectedEmployee === ""
                                ? classes.checkIconVisible
                                : classes.checkIconHidden,
                            )}
                          />
                        </CommandItem>
                      )}
                      {sortedAvailableEmployees.map((employee) => (
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
                                classes.checkIcon,
                                selectedEmployee === employee.id
                                  ? classes.checkIconVisible
                                  : classes.checkIconHidden,
                              )}
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Alert for excluded underage employees */}
            {excludedUnderageEmployees.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>Jugendarbeitsschutzgesetz</AlertTitle>
                <AlertDescription>
                  {excludedUnderageEmployees.map((e) => e.username).join(", ")}{" "}
                  {excludedUnderageEmployees.length === 1 ? "is" : "are"}{" "}
                  underage and cannot work outside 06:00–20:00.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Tags Multi-Select Combobox */}
          {tags.length > 0 && (
            <div className={classes.formRow}>
              <Label>Tags</Label>
              <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={tagsOpen}
                    className={classes.comboboxTrigger}
                  >
                    {selectedTags.length > 0
                      ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""} selected`
                      : "Select tags..."}
                    <ChevronsUpDown className={classes.comboboxIcon} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={classes.popoverContent}>
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandList>
                      <CommandEmpty>No tags found.</CommandEmpty>
                      <CommandGroup>
                        {tags.map((tag) => (
                          <CommandItem
                            key={tag.id}
                            value={tag.value}
                            onSelect={() => {
                              setSelectedTags((prev) =>
                                prev.includes(tag.id)
                                  ? prev.filter((id) => id !== tag.id)
                                  : [...prev, tag.id],
                              );
                            }}
                          >
                            {tag.value}
                            <Check
                              className={cn(
                                classes.checkIcon,
                                selectedTags.includes(tag.id)
                                  ? classes.checkIconVisible
                                  : classes.checkIconHidden,
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
          )}
        </div>

        <DialogFooter>
          {!isAddMode && !isUnassigned && (
            <Button
              variant="destructive"
              className={classes.unassignButton}
              onClick={handleUnassign}
            >
              Unassign
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={(isAddMode && !selectedDepartment) || !isTimeRangeValid}
          >
            {getSubmitLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShiftEditDialog;
