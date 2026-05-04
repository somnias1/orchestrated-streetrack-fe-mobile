function formatValue(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export { currentYearMonth, formatDate, formatValue, monthLabel, todayISO };

