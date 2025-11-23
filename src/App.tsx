import './App.css'
import { Button } from './components/ui/button'
import { ShiftsProvider, useShifts } from './context/ShiftsContext'

function AppContent() {
  const { shifts, loading, error } = useShifts()

  console.log('Shifts data:', shifts)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <Button>Test</Button>
}

function App() {
  return (
    <ShiftsProvider>
      <AppContent />
    </ShiftsProvider>
  )
}

export default App
