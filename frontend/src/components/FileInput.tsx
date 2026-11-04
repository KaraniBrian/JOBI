import { useRef, useState } from 'react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/hooks';

export const DOC_ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp';
export const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp';
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Pick a file from the computer; it is uploaded straight away and the resulting URL
 * is passed to `onChange` (that URL is what the backend stores on the record).
 */
export function FileInput({ value, onChange, accept = DOC_ACCEPT, onUploaded, onBusyChange, label = 'Choose file' }: {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  /** Called with the original file name after a successful upload. */
  onUploaded?: (fileName: string) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setWorking = (value: boolean) => { setBusy(value); onBusyChange?.(value); };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) { setError('That file is larger than 5 MB.'); return; }
    setWorking(true);
    try {
      const result = await api.upload(file);
      setName(result.original_name);
      onChange(result.url);
      onUploaded?.(result.original_name);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setWorking(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="file-input">
      {value ? (
        <div className="file-chip">
          <span className="grow">{name || 'File uploaded'}</span>
          <a href={value} target="_blank" rel="noreferrer">View</a>
          <button type="button" className="icon-btn" aria-label="Remove file" onClick={() => { onChange(''); setName(''); }}>×</button>
        </div>
      ) : (
        <label className={`btn btn-ghost file-pick${busy ? ' is-busy' : ''}`}>
          {busy ? 'Uploading…' : label}
          <input ref={inputRef} type="file" accept={accept} disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} />
        </label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
