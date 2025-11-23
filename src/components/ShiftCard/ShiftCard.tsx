import { forwardRef } from "react";
import type { Shift } from "@/context/ShiftsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import classes from "./ShiftCard.module.css";

interface ShiftCardProps extends React.ComponentPropsWithoutRef<"div"> {
  shift: Shift;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const ShiftCard = forwardRef<HTMLDivElement, ShiftCardProps>(
  ({ shift, className, ...props }, ref) => {
    const isUnassigned = !shift.candidates[0]?.employee.username;

    return (
      <Card
        ref={ref}
        className={cn(isUnassigned && classes.unassigned, className)}
        {...props}
      >
        <CardHeader>
          <CardDescription>
            {formatTime(shift.start_tz)} - {formatTime(shift.end_tz)}
          </CardDescription>
          <CardTitle className={classes.title}>
            {isUnassigned
              ? "Unassigned"
              : shift.candidates[0]?.employee.username}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shift.shift_tags && shift.shift_tags.length > 0 && (
            <div className={classes.tags}>
              {shift.shift_tags.map((shiftTag) => (
                <span key={shiftTag.id} className={classes.tag}>
                  {shiftTag.tag.value}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
);

ShiftCard.displayName = "ShiftCard";

export default ShiftCard;
