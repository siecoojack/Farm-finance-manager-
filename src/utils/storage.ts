import { AppState, Employee, DropdownOption, JournalEntry, MonthlySettlement } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_DROPDOWNS, INITIAL_JOURNAL_ENTRIES, INITIAL_SETTLEMENTS, INITIAL_INVENTORY, CURRENT_MONTH_KEY } from '../data/initialData';

const STORAGE_KEY = 'FARM_FINANCIAL_APP_STATE_V2';

export function loadAppState(): AppState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    // Backward compatibility: check V1 if V2 is not yet initialized
    if (!raw) {
      raw = localStorage.getItem('FARM_FINANCIAL_APP_STATE_V1');
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      
      // Merge or sanitize employees
      const loadedEmployees: Employee[] = (parsed.employees && parsed.employees.length > 0)
        ? parsed.employees.map((emp: any, idx: number) => ({
            ...emp,
            status: emp.status === 'نشط' ? 'منتظم' : emp.status,
            workDays: emp.workDays !== undefined ? emp.workDays : 30,
            raisePercentage: emp.raisePercentage || 0,
            penalties: emp.penalties || 0,
            nationalId: emp.nationalId || (INITIAL_EMPLOYEES[idx]?.nationalId || '')
          }))
        : INITIAL_EMPLOYEES;

      return {
        currentMonth: parsed.currentMonth || CURRENT_MONTH_KEY,
        employees: loadedEmployees,
        dropdowns: parsed.dropdowns || INITIAL_DROPDOWNS,
        journalEntries: parsed.journalEntries || INITIAL_JOURNAL_ENTRIES,
        salesEntries: parsed.salesEntries || [],
        settlements: parsed.settlements || INITIAL_SETTLEMENTS,
        inventory: parsed.inventory || INITIAL_INVENTORY,
        minPettyCashLimit: parsed.minPettyCashLimit || 0,
        officialMiesPerPerson: parsed.officialMiesPerPerson || 1000,
        viewMode: parsed.viewMode || 'desktop',
        activeTab: parsed.activeTab || 'journal'
      };
    }
  } catch (err) {
    console.error('Failed to load saved state:', err);
  }

  return {
    currentMonth: CURRENT_MONTH_KEY,
    employees: INITIAL_EMPLOYEES,
    dropdowns: INITIAL_DROPDOWNS,
    journalEntries: INITIAL_JOURNAL_ENTRIES,
    salesEntries: [],
    settlements: INITIAL_SETTLEMENTS,
    inventory: INITIAL_INVENTORY,
    minPettyCashLimit: 0,
    officialMiesPerPerson: 1000,
    viewMode: 'desktop',
    activeTab: 'journal'
  };
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state:', err);
  }
}

export function resetAppStateToDefaults(): AppState {
  const defaultState: AppState = {
    currentMonth: CURRENT_MONTH_KEY,
    employees: INITIAL_EMPLOYEES,
    dropdowns: INITIAL_DROPDOWNS,
    journalEntries: INITIAL_JOURNAL_ENTRIES,
    salesEntries: [],
    settlements: INITIAL_SETTLEMENTS,
    inventory: INITIAL_INVENTORY,
    minPettyCashLimit: 0,
    officialMiesPerPerson: 0,
    viewMode: 'desktop',
    activeTab: 'journal'
  };
  saveAppState(defaultState);
  return defaultState;
}
