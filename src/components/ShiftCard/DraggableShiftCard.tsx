import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Shift } from "@/context/ShiftsContext";
import classes from "./ShiftCard.module.css";
import { cn } from "@/lib/utils";

interface DraggableShiftCardProps {
  shift: Shift;
  children: React.ReactNode;
}

export function DraggableShiftCard({
  shift,
  children,
}: DraggableShiftCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: shift.id,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: shift.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div
      ref={(node) => {
        setDraggableRef(node);
        setDroppableRef(node);
      }}
      className={cn({
        [classes.isOver]: isOver && !isDragging,
        [classes.isDragging]: isDragging,
      })}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

export default DraggableShiftCard;
