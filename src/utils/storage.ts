import { AppState, Employee, DropdownOption, JournalEntry, MonthlySettlement } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_DROPDOWNS, INITIAL_JOURNAL_ENTRIES, INITIAL_SETTLEMENTS, CURRENT_MONTH_KEY } from '../data/initialData';

const STORAGE_KEY = 'FARM_FINANCIAL_APP_STATE_V1';

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentMonth: parsed.currentMonth || CURRENT_MONTH_KEY,
        employees: parsed.employees || INITIAL_EMPLOYEES,
        dropdowns: parsed.dropdowns || INITIAL_DROPDOWNS,
        journalEntries: parsed.journalEntries || INITIAL_JOURNAL_ENTRIES,
        settlements: parsed.settlements || INITIAL_SETTLEMENTS,
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
    settlements: INITIAL_SETTLEMENTS,
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
    settlements: INITIAL_SETTLEMENTS,
    viewMode: 'desktop',
    activeTab: 'journal'
  };
  saveAppState(defaultState);
  return defaultState;
}
