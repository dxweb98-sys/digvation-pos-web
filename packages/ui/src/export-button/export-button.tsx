import { useState } from 'react';
import { Button } from '../button';
import { Dropdown, useDropdownClose } from '../dropdown';

export type ExportFormat = 'pdf' | 'excel';
export interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<Blob> | Blob | void;
  filename?: string;
  onSuccess?: (format: ExportFormat) => void;
  onError?: (error: unknown, format: ExportFormat) => void;
  onProcessing?: (format: ExportFormat) => void;
  disabled?: boolean;
}
function DownloadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>; }
function ExportContent({ onExport, filename, onSuccess, onError, onProcessing, setLoading }: ExportButtonProps & { filename: string; setLoading: (value: boolean) => void }) {
  const close = useDropdownClose();
  const run = async (format: ExportFormat) => {
    close?.(); setLoading(true);
    try {
      const result = onExport(format);
      if (result instanceof Promise) {
        const blob = await result;
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
        anchor.href = url; anchor.download = `${filename}.${format === 'pdf' ? 'pdf' : 'xlsx'}`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); onSuccess?.(format);
      } else if (result instanceof Blob) {
        const url = URL.createObjectURL(result); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${filename}.${format === 'pdf' ? 'pdf' : 'xlsx'}`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); onSuccess?.(format);
      } else onProcessing?.(format);
    } catch (error) { onError?.(error, format); }
    finally { setLoading(false); }
  };
  return <div className="min-w-[140px] py-1"><button type="button" onClick={() => void run('pdf')} className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">Export PDF</button><button type="button" onClick={() => void run('excel')} className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]">Export Excel</button></div>;
}
export function ExportButton({ filename = 'export', disabled, ...props }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  return <Dropdown placement="bottom-end" trigger={() => <Button variant="outline" size="sm" leftIcon={<DownloadIcon />} loading={loading} disabled={disabled}>Export</Button>}><ExportContent {...props} filename={filename} disabled={disabled} setLoading={setLoading} /></Dropdown>;
}
