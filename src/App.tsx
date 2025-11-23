import './App.css'
import CalendarView from './components/CalendarView'
import { ShiftsProvider } from './context/ShiftsContext'

function App() {
  return (
    <ShiftsProvider>
			<CalendarView />
    </ShiftsProvider>
  )
}

export default App
