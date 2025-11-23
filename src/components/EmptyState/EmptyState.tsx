import { useRef } from "react";
import { CalendarDays, Upload, FileSpreadsheet, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { GenerateTemplateDialog } from "@/components/GenerateTemplateDialog";
import { useShifts } from "@/context/ShiftsContext";
import classes from "./EmptyState.module.css";

export function EmptyState() {
  const { loadShifts, initializeEmpty } = useShifts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = () => {
    // No matter which file is chosen, load shifts.json
    loadShifts();
  };

  return (
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
        <div className={classes.actions}>
          <input
            ref={fileInputRef}
            type="file"
            className={classes.hiddenInput}
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
          <GenerateTemplateDialog>
            <Button variant="outline">
              <Wand2 />
              Generate Template
            </Button>
          </GenerateTemplateDialog>
        </div>
      </EmptyContent>
    </Empty>
  );
}

export default EmptyState;
