import { Button } from "@/components/ui/button";
import { useShifts } from "@/context/ShiftsContext";
import { ShiftEditDialog } from "@/components/ShiftEditDialog";
import classes from "./ToolBar.module.css";

function ToolBar() {
  const { employees, departments, loadShifts } = useShifts();

  return (
    <nav className={classes.block}>
      <ShiftEditDialog departments={departments} employees={employees} />
      <Button variant="outline" onClick={loadShifts}>
        Load Demo Data
      </Button>
    </nav>
  );
}

export default ToolBar;
