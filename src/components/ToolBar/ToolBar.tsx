import { useState } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  } = useShifts();
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);

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
