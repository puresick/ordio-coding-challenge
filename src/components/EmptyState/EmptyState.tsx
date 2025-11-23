import { useEffect, useRef, useState } from "react";
import { CalendarDays, Upload, FileSpreadsheet, Wand2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useShifts } from "@/context/ShiftsContext";
import type { BranchWorkingArea, Employee, Shift } from "@/context/ShiftsContext";

const WEEKDAYS = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

export function EmptyState() {
  const { loadShifts, initializeEmpty, generateTemplate } = useShifts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Template form state
  const [shiftsPerDay, setShiftsPerDay] = useState(2);
  const [shiftLengthHours, setShiftLengthHours] = useState(6);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]);

  // Department and employees selection state
  const [departments, setDepartments] = useState<BranchWorkingArea[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<BranchWorkingArea | null>(null);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Fetch departments and employees when wizard opens
  useEffect(() => {
    if (wizardOpen && departments.length === 0) {
      setLoadingDepartments(true);
      fetch("/shifts.json")
        .then((res) => res.json())
        .then((data: Shift[]) => {
          // Extract unique departments
          const uniqueDepartments = [
            ...new Map(
              data.map((s) => [s.branch_working_area.id, s.branch_working_area])
            ).values(),
          ].toSorted((a, b) => a.working_area.name.localeCompare(b.working_area.name));
          setDepartments(uniqueDepartments);
          if (uniqueDepartments.length > 0) {
            setSelectedDepartment(uniqueDepartments[0]);
          }

          // Extract unique employees
          const uniqueEmployees = [
            ...new Map(
              data
                .flatMap((s) => s.candidates.map((c) => c.employee))
                .filter((e) => e?.username)
                .map((e) => [e.id, e])
            ).values(),
          ].toSorted((a, b) => a.username.localeCompare(b.username));
          setAvailableEmployees(uniqueEmployees);
        })
        .finally(() => setLoadingDepartments(false));
    }
  }, [wizardOpen, departments.length]);

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((d) => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleGenerate = () => {
    if (!selectedDepartment || selectedDays.length === 0) return;

    generateTemplate({
      shiftsPerDay,
      shiftLengthHours,
      selectedDays,
      department: selectedDepartment,
      employees: availableEmployees,
    });
    setWizardOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = () => {
    // No matter which file is chosen, load shifts.json
    loadShifts();
  };

  return (
    <>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyTitle>No Shift Plan Yet</EmptyTitle>
          <EmptyDescription>
            Get started by uploading an existing shift plan, starting fresh with
            an empty table, or generating a template to explore the features.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".json,.csv,.xlsx,.png,.jpg,.jpeg"
            />
            <Button onClick={handleUploadClick}>
              <Upload />
              Upload File
            </Button>
            <Button variant="outline" onClick={initializeEmpty}>
              <FileSpreadsheet />
              Start Empty
            </Button>
            <Button variant="outline" onClick={() => setWizardOpen(true)}>
              <Wand2 />
              Generate Template
            </Button>
          </div>
        </EmptyContent>
      </Empty>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Template Shift Plan</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shiftsPerDay" className="text-right">
                Shifts per day
              </Label>
              <Input
                id="shiftsPerDay"
                type="number"
                min={1}
                max={20}
                value={shiftsPerDay}
                onChange={(e) => setShiftsPerDay(Number(e.target.value))}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shiftLength" className="text-right">
                Shift length (hours)
              </Label>
              <Input
                id="shiftLength"
                type="number"
                min={1}
                max={24}
                value={shiftLengthHours}
                onChange={(e) => setShiftLengthHours(Number(e.target.value))}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Department</Label>
              <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={departmentOpen}
                    className="col-span-3 justify-between"
                    disabled={loadingDepartments}
                  >
                    {loadingDepartments
                      ? "Loading..."
                      : selectedDepartment?.working_area.name ?? "Select department..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                            key={dept.id}
                            value={dept.working_area.name}
                            onSelect={() => {
                              setSelectedDepartment(dept);
                              setDepartmentOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDepartment?.id === dept.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {dept.working_area.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Days</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex flex-wrap gap-3">
                  {WEEKDAYS.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.id}
                        checked={selectedDays.includes(day.id)}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <Label htmlFor={day.id} className="font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setSelectedDays(WEEKDAYS.map((d) => d.id))}
                  >
                    Select all
                  </Button>
                  <span className="text-muted-foreground">·</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setSelectedDays([])}
                  >
                    Deselect all
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWizardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default EmptyState;
