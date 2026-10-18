import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '../ToastContext';

// ─── Data row type matching the user's spreadsheet ───
export interface PricingRow {
  service: string;
  tier: string;
  tierLabel: string;
  procMin: string;
  procMax: string;
  '12h': number;
  '24h': number;
  '48h': number;
  '72h': number;
  '7d': number;
}

interface SpreadsheetGridProps {
  rows: PricingRow[];
  onChange: (rows: PricingRow[]) => void;
}

const TURNAROUNDS = ['12h', '24h', '48h', '72h', '7d'] as const;

// ─── Parse pasted tab-separated text matching the user's CSV format ───
function parsePastedRows(text: string): PricingRow[] {
  const lines = text.trim().split('\n');
  const parsed: PricingRow[] = [];
  let currentService = '';

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split('\t');

    // Skip if fewer than 4 columns
    if (cols.length < 4) continue;

    // Detect and skip header row
    const firstCol = cols[0]?.trim().toLowerCase();
    if (firstCol === 'services' || firstCol === 'service') continue;

    // Column 0: Service name (may be empty = carry forward)
    const svcRaw = cols[0]?.trim();
    if (svcRaw) currentService = svcRaw;
    if (!currentService) continue;

    // Column 1: Tier key
    const tier = cols[1]?.trim();
    if (!tier) continue;

    // Column 2: Processing time min (text)
    const procMin = cols[2]?.trim() || '';

    // Column 3: Processing time max (text)
    const procMax = cols[3]?.trim() || '';

    // Columns 4-8: Prices (strip $ prefix, parse float)
    const prices: Record<string, number> = {};
    for (let j = 0; j < TURNAROUNDS.length; j++) {
      const raw = cols[j + 4]?.trim();
      if (raw !== undefined && raw !== '') {
        const cleaned = raw.replace(/[$,\s]/g, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num)) {
          prices[TURNAROUNDS[j]] = num;
        }
      }
    }

    // Build tier label from tier key (will be overwritten on paste-match)
    const tierLabel = tier;

    parsed.push({
      service: currentService,
      tier,
      tierLabel,
      procMin,
      procMax,
      '12h': prices['12h'] ?? 0,
      '24h': prices['24h'] ?? 0,
      '48h': prices['48h'] ?? 0,
      '72h': prices['72h'] ?? 0,
      '7d': prices['7d'] ?? 0,
    });
  }

  return parsed;
}

// ─── Generate export text matching the user's CSV format ───
function generateExportText(rows: PricingRow[]): string {
  const lines: string[] = ['Services\tC/T\tProcessing Time\t\t12h\t24h\t48h\t72h\t7d'];

  for (const row of rows) {
    const line = [
      row.service,
      row.tier,
      row.procMin,
      row.procMax,
      `$${(row['12h'] ?? 0).toFixed(2)}`,
      `$${(row['24h'] ?? 0).toFixed(2)}`,
      `$${(row['48h'] ?? 0).toFixed(2)}`,
      `$${(row['72h'] ?? 0).toFixed(2)}`,
      `$${(row['7d'] ?? 0).toFixed(2)}`,
    ];
    lines.push(line.join('\t'));
  }

  return lines.join('\n');
}

// ─── Cell Input component ───
const CellInput: React.FC<{
  value: string | number;
  onChange: (val: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}> = ({ value, onChange, type = 'text', placeholder, className = '', readOnly }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (!readOnly && String(localValue) !== String(value)) {
      onChange(String(localValue));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type={type}
      step={type === 'number' ? '0.01' : undefined}
      value={localValue}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-full h-8 border-0 bg-transparent px-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:bg-blue-50/50 transition-colors tabular-nums ${readOnly ? 'text-gray-300 cursor-default' : 'hover:bg-gray-50'} ${className}`}
    />
  );
};

// ─── Main Component ───
export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  rows,
  onChange,
}) => {
  const { showToast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  // ─── Update a single cell ───
  const updateCell = useCallback(
    (index: number, field: keyof PricingRow, value: any) => {
      const copy = [...rows];
      copy[index] = { ...copy[index], [field]: value };
      onChange(copy);
    },
    [rows, onChange]
  );

  // ─── Update a price cell (parse to number) ───
  const updatePrice = useCallback(
    (index: number, field: string, rawValue: string) => {
      const cleaned = rawValue.replace(/[$,\s]/g, '');
      const num = parseFloat(cleaned);
      updateCell(index, field as keyof PricingRow, isNaN(num) ? 0 : num);
    },
    [updateCell]
  );

  // ─── Paste handler ───
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData('text');
      if (!text) return;

      e.preventDefault();

      const parsed = parsePastedRows(text);
      if (parsed.length === 0) {
        showToast('No valid data found. Expected: Services | C/T | ProcMin | ProcMax | 12h | 24h | 48h | 72h | 7d', 'error');
        return;
      }

      onChange(parsed);
      const msg = `Pasted ${parsed.length} row${parsed.length > 1 ? 's' : ''} successfully`;
      setPasteFeedback(msg);
      showToast(msg);
      setTimeout(() => setPasteFeedback(null), 3000);
    },
    [onChange, showToast]
  );

  // ─── Export CSV ───
  const handleExportCSV = useCallback(() => {
    const text = generateExportText(rows);
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pricing-matrix.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded');
  }, [rows, showToast]);

  // ─── Copy to clipboard ───
  const handleCopyToClipboard = useCallback(() => {
    const text = generateExportText(rows);
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied - paste into Excel or Google Sheets');
    }).catch(() => {
      showToast('Failed to copy', 'error');
    });
  }, [rows, showToast]);

  // ─── Add row ───
  const handleAddRow = useCallback(() => {
    const newRow: PricingRow = {
      service: '',
      tier: '',
      tierLabel: '',
      procMin: '',
      procMax: '',
      '12h': 0, '24h': 0, '48h': 0, '72h': 0, '7d': 0,
    };
    // If no rows yet, require service name
    if (rows.length === 0) {
      newRow.service = 'New Service';
    }
    onChange([...rows, newRow]);
  }, [rows, onChange]);

  // ─── Delete row ───
  const handleDeleteRow = useCallback(
    (index: number) => {
      const copy = [...rows];
      copy.splice(index, 1);
      onChange(copy);
    },
    [rows, onChange]
  );

  // ─── Add row after specific index ───
  const handleAddRowAfter = useCallback(
    (index: number) => {
      const newRow: PricingRow = {
        service: '', // continues the same service
        tier: '',
        tierLabel: '',
        procMin: '',
        procMax: '',
        '12h': 0, '24h': 0, '48h': 0, '72h': 0, '7d': 0,
      };
      const copy = [...rows];
      copy.splice(index + 1, 0, newRow);
      onChange(copy);
    },
    [rows, onChange]
  );

  // ─── Compute display service names (resolve empty = carry forward) ───
  const displayService: string[] = [];
  let lastSvc = '';
  for (const row of rows) {
    if (row.service) lastSvc = row.service;
    displayService.push(lastSvc);
  }

  // ─── Detect service group boundaries for visual grouping ───
  const serviceStarts = new Set<number>();
  let prevSvc = '';
  rows.forEach((row, i) => {
    const svc = row.service || prevSvc;
    if (svc !== prevSvc) serviceStarts.add(i);
    prevSvc = svc;
  });

  const uniqueServices = new Set(displayService).size;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-[14px] text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {showInstructions ? 'Hide' : 'Show'} paste instructions
          </button>
          {pasteFeedback && (
            <span className="text-[14px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded animate-pulse">
              {pasteFeedback}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="h-8 px-3 bg-white border border-gray-200 text-gray-600 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy for Excel
          </button>
          <button
            onClick={handleExportCSV}
            className="h-8 px-3 bg-white border border-gray-200 text-gray-600 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      {/* Instructions panel */}
      {showInstructions && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-[14px] text-blue-800 space-y-2">
          <p className="font-semibold text-[14px] uppercase tracking-wider text-blue-600">How to paste from spreadsheet</p>
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>In Excel or Google Sheets, select your pricing data (including headers)</li>
            <li>Columns must be: <code className="bg-blue-100 px-1 rounded text-[14px]">Services | C/T | Proc Min | Proc Max | 12h | 24h | 48h | 72h | 7d</code></li>
            <li>Copy with <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[14px] font-mono">Ctrl+C</kbd></li>
            <li>Click anywhere in the grid below</li>
            <li>Paste with <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[14px] font-mono">Ctrl+V</kbd></li>
          </ol>
          <p className="text-[14px] text-blue-500 pt-1">
            Empty service cells carry forward from the row above. $ prefixes on prices are stripped automatically. Header row is auto-detected and skipped.
          </p>
        </div>
      )}

      {/* Spreadsheet */}
      <div
        ref={gridRef}
        onPaste={handlePaste}
        tabIndex={0}
        className="bg-white rounded-xl border border-gray-200/80 overflow-hidden outline-none focus:ring-2 focus:ring-blue-200"
      >
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[15px] text-gray-400 mb-2">No pricing data</p>
            <p className="text-[14px] text-gray-300">Paste from Excel/Sheets or click "+ Add Row" below</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-500 uppercase tracking-wider text-[14px] w-[180px] min-w-[160px]">Services</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-500 uppercase tracking-wider text-[14px] w-[60px]">C/T</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 uppercase tracking-wider text-[14px] w-[80px]">Proc Min</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-gray-500 uppercase tracking-wider text-[14px] w-[80px]">Proc Max</th>
                  {TURNAROUNDS.map(t => (
                    <th key={t} className="text-center py-2.5 px-2 font-semibold text-gray-500 uppercase tracking-wider text-[14px] w-[72px]">{t}</th>
                  ))}
                  <th className="w-[32px]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isSvcStart = serviceStarts.has(i);
                  const svcBg = isSvcStart ? 'bg-gray-50/60' : '';

                  return (
                    <tr
                      key={i}
                      className={`border-b border-gray-100 group hover:bg-blue-50/30 transition-colors ${svcBg}`}
                    >
                      {/* Service name - only editable on first row of each group */}
                      <td className="px-0 border-r border-gray-100">
                        <CellInput
                          value={row.service}
                          onChange={v => updateCell(i, 'service', v)}
                          placeholder={isSvcStart ? 'Service name' : ''}
                          readOnly={!isSvcStart && !row.service}
                          className={!row.service && !isSvcStart ? 'text-gray-300 italic' : 'font-medium'}
                        />
                      </td>

                      {/* Tier key */}
                      <td className="px-0 border-r border-gray-100">
                        <CellInput
                          value={row.tier}
                          onChange={v => updateCell(i, 'tier', v)}
                          placeholder="S"
                          className="text-center"
                        />
                      </td>

                      {/* Processing time min */}
                      <td className="px-0 border-r border-gray-100">
                        <CellInput
                          value={row.procMin}
                          onChange={v => updateCell(i, 'procMin', v)}
                          placeholder="3"
                          className="text-center"
                        />
                      </td>

                      {/* Processing time max */}
                      <td className="px-0 border-r border-gray-100">
                        <CellInput
                          value={row.procMax}
                          onChange={v => updateCell(i, 'procMax', v)}
                          placeholder="5"
                          className="text-center"
                        />
                      </td>

                      {/* Price columns */}
                      {TURNAROUNDS.map(t => (
                        <td key={t} className="px-0 border-r border-gray-100 last:border-r-0">
                          <CellInput
                            value={(row[t] ?? 0).toFixed(2)}
                            onChange={v => updatePrice(i, t, v)}
                            type="text"
                            className="text-center font-mono"
                          />
                        </td>
                      ))}

                      {/* Row actions */}
                      <td className="px-1 text-center">
                        <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleAddRowAfter(i)}
                            title="Add row below"
                            className="p-1 rounded hover:bg-blue-100 text-gray-300 hover:text-blue-500 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteRow(i)}
                            title="Delete row"
                            className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[14px] text-gray-400">
          {uniqueServices} services · {rows.length} rows · 5 turnaround speeds
        </span>
        <button
          onClick={handleAddRow}
          className="h-8 px-3 bg-white border border-dashed border-gray-300 text-gray-500 rounded-lg text-[14px] font-medium hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Row
        </button>
      </div>
    </div>
  );
};
