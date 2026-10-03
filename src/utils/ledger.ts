import { JournalEntry } from '../types';

export interface LedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export const getLedgerForAccount = (entries: JournalEntry[], accountName: string) => {
  const accountEntries = entries
    .filter(e => e.debitAccount === accountName || e.creditAccount === accountName)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const ledger = accountEntries.map(entry => {
    const isDebit = entry.debitAccount === accountName;
    const isCredit = entry.creditAccount === accountName;
    
    // Simplistic logic: Assets/Expenses (Debit) + Liabilities/Revenue (Credit)
    // Needs adjustment based on accounting standard if runningBalance is meant to be meaningful
    const amount = entry.amount;
    
    if (isDebit) runningBalance += amount;
    if (isCredit) runningBalance -= amount;

    return {
      date: entry.date,
      description: entry.statement,
      debit: isDebit ? amount : 0,
      credit: isCredit ? amount : 0,
      runningBalance
    };
  });

  return { ledger, finalBalance: runningBalance };
};
