import { useProgramsContext } from '../context/ProgramsContext'

/** @deprecated Prefer useProgramsContext — kept for existing page imports */
export function usePrograms() {
  return useProgramsContext()
}