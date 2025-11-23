import { Button } from "@/components/ui/button";
import { useShifts } from "@/context/ShiftsContext";
import classes from "./ToolBar.module.css";

function ToolBar() {
  const { loadShifts } = useShifts();

  return (
    <nav className={classes.block}>
      <Button variant="outline" onClick={loadShifts}>
        Load Demo Data
      </Button>
    </nav>
  );
}

export default ToolBar;
