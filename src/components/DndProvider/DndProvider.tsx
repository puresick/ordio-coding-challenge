import type { ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import { useShifts } from "@/context/ShiftsContext";

interface DndProviderProps {
  children: ReactNode;
}

function isStringId(id: UniqueIdentifier): id is string {
  return typeof id === "string";
}

export function DndProvider({ children }: DndProviderProps) {
  const { shifts, swapShifts, moveShiftTo } = useShifts();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 14,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;
    if (!isStringId(active.id) || !isStringId(over.id)) return;

    const sourceShiftId = active.id;
    const targetShiftId = over.id;

    const targetShift = shifts.find((s) => s.id === targetShiftId);

    if (!targetShift) return;

    const isTargetUnassigned =
      !targetShift.candidates[0] ||
      !targetShift.candidates[0]?.employee.username;

    if (isTargetUnassigned) {
      // Move source shift to target's slot
      moveShiftTo(sourceShiftId, targetShiftId);
    } else {
      // Swap both shifts
      swapShifts(sourceShiftId, targetShiftId);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
}

export default DndProvider;
