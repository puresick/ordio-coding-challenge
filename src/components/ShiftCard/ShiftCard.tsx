import { forwardRef } from "react";
import type { Shift } from "@/context/ShiftsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    const isUnassigned =
      !shift.candidates[0] || !shift.candidates[0]?.employee.username;

    return (
      <Card
        ref={ref}
        className={`cursor-pointer ${isUnassigned ? "border-dashed border-gray-500 shadow-none bg-gray-100" : ""} ${className ?? ""}`}
        {...props}
      >
        <CardHeader>
          <CardDescription>
            {formatTime(shift.start_tz)} - {formatTime(shift.end_tz)}
          </CardDescription>
          <CardTitle className="line-clamp-2 min-h-[2lh]">
            {isUnassigned
              ? "Unassigned"
              : shift.candidates[0]?.employee.username}
          </CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    );
  },
);

ShiftCard.displayName = "ShiftCard";

export default ShiftCard;
