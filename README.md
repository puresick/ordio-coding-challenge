# Shift Planner Calendar

A modern, interactive shift planning calendar application built as a coding challenge submission for Ordio's Senior Frontend Developer position.

## Tech Stack

- **React 19** with TypeScript for type-safe component development
- **CSS Modules** for scoped, maintainable styling
- **Vite** as the build tool and development server
- **shadcn/ui** for accessible, customizable UI components
- **@dnd-kit** for drag-and-drop functionality

## Getting Started

### Prerequisites

- Node.js 24.11.1+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`.

### Build

```bash
pnpm run build
```

## Features

### Empty State & Onboarding

When no shift data is present, users are presented with three options to get started:

- **Upload File**: Import an existing shift plan. For demonstration purposes, any uploaded file will load the included demo dataset.
- **Start Empty**: Begin with a blank calendar to build a shift plan from scratch.
- **Generate Template**: Automatically create a configurable shift template with customizable parameters (shifts per day, shift duration, working days, and department selection).

### Weekly Calendar View

The main interface displays shifts organized by department (rows) and weekday (columns). Each shift card shows:

- Time range (start and end times)
- Assigned employee name or "Unassigned" status
- Shift tags for categorization

Unassigned shifts are visually distinguished with a dashed border, making it easy to identify slots that need staffing.

### Shift Management

**Creating Shifts**: New shifts can be added through the toolbar button or by using the context-aware add buttons that appear within each department row. The creation dialog allows setting the department, day, time range, and optionally pre-assigning an employee.

**Editing Shifts**: Clicking any shift card opens an edit dialog where all shift properties can be modified. Employees can be assigned, reassigned, or unassigned from shifts.

**Drag and Drop**: Shifts can be reassigned by dragging an employee's shift card onto an unassigned slot. The interface provides visual feedback during drag operations, with the target slot scaling up to indicate it will accept the drop.

### Employee Assignment & Validation

The application includes business logic validation for shift assignments:

- **Age Verification**: When assigning an employee under 18 years old to a shift, a warning is displayed.

### Navigation

- **Week Navigation**: Previous/next week buttons and a "Today" button for quick navigation
- **Date Picker**: Jump to any specific date using the calendar popover
- **Template Generation**: Quickly populate the calendar with a generated shift template for testing or starting fresh

## Future Improvements

Given more time, the following enhancements would be prioritized:

- **Accessibility**: Comprehensive keyboard navigation, ARIA labels, and screen reader announcements for drag-and-drop operations
- **Undo/Redo**: Action history with the ability to revert changes
- **Mobile Responsiveness**: Optimized touch interactions and layout for smaller screens
