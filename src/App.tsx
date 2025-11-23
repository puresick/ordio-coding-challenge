import "./App.css";
import CalendarView from "./components/CalendarView";
import { EmptyState } from "./components/EmptyState";
import ToolBar from "./components/ToolBar";
import { ShiftsProvider, useShifts } from "./context/ShiftsContext";

function AppContent() {
  const { initialized } = useShifts();

  if (!initialized) {
    return <EmptyState />;
  }

  return (
    <>
      <ToolBar />
      <CalendarView />
    </>
  );
}

function App() {
  return (
    <ShiftsProvider>
      <AppContent />
    </ShiftsProvider>
  );
}

export default App;
