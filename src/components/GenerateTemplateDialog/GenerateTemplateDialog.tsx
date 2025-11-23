import { useEffect, useState } from "react";
import { Wand2, Check, ChevronsUpDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useShifts } from "@/context/ShiftsContext";
import type { BranchWorkingArea, Shift } from "@/context/ShiftsContext";

const WEEKDAYS = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

interface GenerateTemplateDialogProps {
  children?: React.ReactNode;
}

export function GenerateTemplateDialog({
  children,
}: GenerateTemplateDialogProps) {
  const { shifts, generateTemplate } = useShifts();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  // Department selection state
  const [departments, setDepartments] = useState<BranchWorkingArea[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<BranchWorkingArea | null>(null);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Fetch departments when wizard opens
  useEffect(() => {
    if (wizardOpen && departments.length === 0) {
      setLoadingDepartments(true);
      fetch("/shifts.json")
        .then((res) => res.json())
        .then((data: Shift[]) => {
          // Extract unique departments
          const uniqueDepartments = [
            ...new Map(
              data.map((s) => [
                s.branch_working_area.id,
                s.branch_working_area,
              ]),
            ).values(),
          ].toSorted((a, b) =>
            a.working_area.name.localeCompare(b.working_area.name),
          );
          setDepartments(uniqueDepartments);
          if (uniqueDepartments.length > 0) {
            setSelectedDepartment(uniqueDepartments[0]);
          }
        })
        .finally(() => setLoadingDepartments(false));
    }
  }, [wizardOpen, departments.length]);

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId],
    );
  };

  const hasExistingShifts =
    selectedDepartment &&
    shifts.some((s) => s.branch_working_area.id === selectedDepartment.id);

  const handleGenerateClick = () => {
    if (!selectedDepartment || selectedDays.length === 0) return;

    if (hasExistingShifts) {
      setConfirmOpen(true);
    } else {
      doGenerate();
    }
  };

  const doGenerate = () => {
    if (!selectedDepartment || selectedDays.length === 0) return;

    generateTemplate({
      shiftsPerDay,
      shiftLengthHours,
      selectedDays,
      department: selectedDepartment,
    });
    setConfirmOpen(false);
    setWizardOpen(false);
  };

  return (
    <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline">
            <Wand2 className="h-4 w-4" />
            Generate Template
          </Button>
        )}
      </DialogTrigger>
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
                    : (selectedDepartment?.working_area.name ??
                      "Select department...")}
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
                                : "opacity-0",
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
          <Button onClick={handleGenerateClick}>Generate</Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite existing shifts?</AlertDialogTitle>
            <AlertDialogDescription>
              The department "{selectedDepartment?.working_area.name}" already
              has shifts assigned. Generating a new template will replace all
              existing shifts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doGenerate}>
              Generate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

export default GenerateTemplateDialog;
