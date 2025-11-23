import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useShifts } from "@/context/ShiftsContext";
import type { Shift, Employee } from "@/context/ShiftsContext";
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
  shift: Shift;
  employees: Employee[];
  departments: string[];
  children: React.ReactNode;
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
  children,
}: ShiftEditDialogProps) {
  const { assignEmployee, unassignEmployee, updateShift } = useShifts();

  const currentEmployee = shift.candidates[0]?.employee;
  const currentDepartment = shift.branch_working_area.working_area.name;
  const currentDay = getWeekdayFromDateString(shift.start_tz);
  const isUnassigned = !currentEmployee?.username;

  const [open, setOpen] = useState(false);

  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>(
    currentEmployee?.id ?? "",
  );

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<string>(currentDepartment);

  const [dayOpen, setDayOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(currentDay);

  const [startTime, setStartTime] = useState(formatTimeForInput(shift.start_tz));
  const [endTime, setEndTime] = useState(formatTimeForInput(shift.end_tz));

  const handleSave = () => {
    const employee = employees.find((e) => e.id === selectedEmployee);

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
    setOpen(false);
  };

  const handleUnassign = () => {
    unassignEmployee(shift.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isUnassigned ? "Assign Shift" : "Edit Shift"}</DialogTitle>
          <DialogDescription>
            {isUnassigned
              ? "Select an employee to assign to this shift."
              : "Update the shift details below. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Employee Combobox */}
          <div className="grid gap-2">
            <Label>Employee</Label>
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
                    : "Select employee..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="Search employee..." />
                  <CommandList>
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      {employees.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          value={employee.username}
                          onSelect={() => {
                            setSelectedEmployee(
                              employee.id === selectedEmployee ? "" : employee.id,
                            );
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

          {!isUnassigned && (
            <>
              {/* Department Combobox */}
              <div className="grid gap-2">
                <Label>Department</Label>
                <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={departmentOpen}
                      className="justify-between"
                    >
                      {selectedDepartment || "Select department..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search department..." />
                      <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup>
                          {departments.map((dept) => (
                            <CommandItem
                              key={dept}
                              value={dept}
                              onSelect={(value) => {
                                setSelectedDepartment(
                                  value === selectedDepartment ? "" : value,
                                );
                                setDepartmentOpen(false);
                              }}
                            >
                              {dept}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  selectedDepartment === dept
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
                <Label>Day</Label>
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
                                setSelectedDay(value === selectedDay ? "" : value);
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
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-time">End Time</Label>
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
        </div>

        <DialogFooter>
          {!isUnassigned && (
            <Button variant="destructive" className="mr-auto" onClick={handleUnassign}>
              Unassign
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>
            {isUnassigned ? "Assign" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShiftEditDialog;
