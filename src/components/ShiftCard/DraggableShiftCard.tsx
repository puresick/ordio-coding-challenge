import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { Shift } from "@/context/ShiftsContext";

interface DraggableShiftCardProps {
  shift: Shift;
  children: React.ReactNode;
}

export function DraggableShiftCard({ shift, children }: DraggableShiftCardProps) {
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
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    outline: isOver ? "2px solid #3b82f6" : undefined,
    outlineOffset: isOver ? "2px" : undefined,
  };

  return (
    <div
      ref={(node) => {
        setDraggableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

export default DraggableShiftCard;
