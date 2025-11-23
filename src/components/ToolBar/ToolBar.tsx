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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useShifts } from "@/context/ShiftsContext";
import { ShiftEditDialog } from "@/components/ShiftEditDialog";
import classes from "./ToolBar.module.css";

function ToolBar() {
  const { shifts, employees, departments, loadShifts, purgeShifts } = useShifts();

  return (
    <nav className={classes.block}>
      <div className={classes.left}>
        <ShiftEditDialog departments={departments} employees={employees} />
      </div>
      <div className={classes.right}>
        {shifts.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Purge Plan</Button>
            </AlertDialogTrigger>
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
                <AlertDialogAction onClick={purgeShifts}>
                  Purge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button variant="outline" onClick={loadShifts}>
          Load Demo Data
        </Button>
      </div>
    </nav>
  );
}

export default ToolBar;
