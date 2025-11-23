import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useShifts } from "@/context/ShiftsContext";
import { ShiftEditDialog } from "@/components/ShiftEditDialog";
import { GenerateTemplateDialog } from "@/components/GenerateTemplateDialog";
import classes from "./ToolBar.module.css";

function ToolBar() {
  const {
    shifts,
    employees,
    departments,
    loadShifts,
    purgeShifts,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToDate,
  } = useShifts();
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleCalendarConfirm = () => {
    if (selectedDate) {
      goToDate(selectedDate);
    }
    setCalendarOpen(false);
    setSelectedDate(undefined);
  };

  const handleCalendarCancel = () => {
    setCalendarOpen(false);
    setSelectedDate(undefined);
  };

  return (
    <nav className={classes.block}>
      <div className={classes.left}>
        <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={goToCurrentWeek}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <CalendarDays className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
            <div className="flex justify-end gap-2 p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalendarCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCalendarConfirm}
                disabled={!selectedDate}
              >
                Confirm
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className={classes.right}>
        <GenerateTemplateDialog />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={loadShifts}>
              Load Demo Data
            </DropdownMenuItem>
            {shifts.length > 0 && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setPurgeDialogOpen(true)}
              >
                Purge Plan
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={purgeDialogOpen} onOpenChange={setPurgeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Purge shift plan?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all shifts from the current plan. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={purgeShifts}>Purge</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <ShiftEditDialog departments={departments} employees={employees} />
      </div>
    </nav>
  );
}

export default ToolBar;
