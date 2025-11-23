import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// Types based on shifts.json structure
export interface Branch {
  id: number
  name: string
  enabled: boolean
}

export interface WorkingArea {
  id: number
  name: string
  status: boolean
}

export interface BranchWorkingArea {
  id: number
  branch: Branch
  working_area: WorkingArea
  sort: number
  status: boolean
}

export interface Employee {
  id: string
  user_id: string | null
  email: string
  employment: number
  phone: string | null
  company: unknown
  username: string
}

export interface Candidate {
  id: string
  employee: Employee
}

export interface TimeFrame {
  gte: string
  lte: string
}

export interface Shift {
  id: string
  type: string
  start_tz: string
  end_tz: string
  working_time_in_minutes: number
  time_frame: TimeFrame
  timezone: string
  employee_count: number
  note: string
  automatically_accept: boolean
  canditature_system: boolean
  pause: string
  pause_paid: boolean
  auto_break_rule: boolean
  status: boolean
  publish: boolean
  branch_working_area: BranchWorkingArea
  company_cost_centre: unknown
  company_event: unknown
  multi_checks: unknown
  multi_check: unknown
  candidates: Candidate[]
}

// Context
interface ShiftsContextValue {
  shifts: Shift[]
  loading: boolean
  error: string | null
}

const ShiftsContext = createContext<ShiftsContextValue | null>(null)

export function useShifts() {
  const context = useContext(ShiftsContext)
  if (!context) {
    throw new Error('useShifts must be used within a ShiftsProvider')
  }
  return context
}

interface ShiftsProviderProps {
  children: ReactNode
}

export function ShiftsProvider({ children }: ShiftsProviderProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/shifts.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch shifts: ${response.status}`)
        }
        return response.json()
      })
      .then((data: Shift[]) => {
        setShifts(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      })
  }, [])

  return (
    <ShiftsContext.Provider value={{ shifts, loading, error }}>
      {children}
    </ShiftsContext.Provider>
  )
}
