import type { Shift } from "@/context/ShiftsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ShiftCardProps {
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

export function ShiftCard({ shift }: ShiftCardProps) {
  const isUnassigned =
    !shift.candidates[0] || !shift.candidates[0]?.employee.username;

  return (
    <Card
      className={`cursor-pointer ${isUnassigned ? "border-dashed shadow-none bg-gray-100" : ""}`}
    >
      <CardHeader>
        <CardDescription>
          {new Date(shift.start_tz).toLocaleDateString()}
        </CardDescription>
        <CardTitle className="line-clamp-2 min-h-[2lh]">
          {isUnassigned ? "Unassigned" : shift.candidates[0]?.employee.username}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          {formatTime(shift.start_tz)} - {formatTime(shift.end_tz)}
        </p>
        <p>{shift.branch_working_area.working_area.name}</p>
      </CardContent>
    </Card>
  );
}

export default ShiftCard;
