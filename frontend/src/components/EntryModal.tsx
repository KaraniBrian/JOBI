import { useState, type FormEvent } from 'react';
import { clean } from '../lib/api';
import { useAction } from '../lib/hooks';
import { FileInput, IMAGE_ACCEPT, DOC_ACCEPT } from './FileInput';
import { Button, Field, FormError, Modal } from './ui';

export interface FieldSpec {
  name: string;
  label: string;
  type?: 'text' | 'date' | 'datetime-local' | 'number' | 'url' | 'email' | 'textarea' | 'checkbox' | 'select' | 'file';
  required?: boolean;
  wide?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** For type 'file': only images are allowed (e.g. a logo). */
  imageOnly?: boolean;
  /** For type 'file': another field to fill with the uploaded file's name. */
  fillName?: string;
}

/**
 * A small config-driven form in a modal. Empty values are dropped before submitting
 * (the backend rejects empty strings for optional fields), numbers are sent as numbers.
 */
export function EntryModal({ title, fields, initial, submitLabel = 'Save', onClose, onSubmit, wide }: {
  title: string;
  fields: FieldSpec[];
  initial?: Record<string, string | boolean>;
  submitLabel?: string;
  wide?: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<unknown>;
}) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const start: Record<string, string | boolean> = {};
    for (const f of fields) start[f.name] = initial?.[f.name] ?? (f.type === 'checkbox' ? false : '');
    return start;
  });
  const action = useAction();
  const [uploading, setUploading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const missing = fields.find((f) => f.type === 'file' && f.required && !values[f.name]);
    if (missing) { action.setError(`Please choose a file for “${missing.label}”.`); return; }
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.type === 'number') body[f.name] = v === '' ? undefined : Number(v);
      else if (f.type === 'datetime-local') body[f.name] = v ? new Date(String(v)).toISOString() : undefined;
      else body[f.name] = typeof v === 'string' ? v.trim() : v;
    }
    const result = await action.run(() => onSubmit(clean(body)));
    if (result !== undefined) onClose();
  };

  return (
    <Modal title={title} onClose={onClose} wide={wide}>
      <form className="form-grid" onSubmit={submit}>
        {fields.map((f) => {
          const common = { required: f.required, placeholder: f.placeholder };
          const set = (v: string | boolean) => setValues((prev) => ({ ...prev, [f.name]: v }));
          if (f.type === 'checkbox') {
            return (
              <div key={f.name} className="field-wide">
                <label className="check"><input type="checkbox" checked={Boolean(values[f.name])} onChange={(e) => set(e.target.checked)} />{f.label}</label>
              </div>
            );
          }
          if (f.type === 'file') {
            return (
              <div key={f.name} className="field field-wide">
                <span className="field-label">{f.label}</span>
                <FileInput
                  value={String(values[f.name])}
                  accept={f.imageOnly ? IMAGE_ACCEPT : DOC_ACCEPT}
                  onChange={(url) => set(url)}
                  onBusyChange={setUploading}
                  onUploaded={(fileName) => f.fillName && setValues((prev) => ({ ...prev, [f.fillName as string]: fileName }))}
                />
                {f.hint && <span className="field-hint">{f.hint}</span>}
              </div>
            );
          }
          return (
            <Field key={f.name} label={f.label} hint={f.hint} wide={f.wide || f.type === 'textarea'}>
              {f.type === 'textarea' ? (
                <textarea {...common} value={String(values[f.name])} onChange={(e) => set(e.target.value)} />
              ) : f.type === 'select' ? (
                <select {...common} value={String(values[f.name])} onChange={(e) => set(e.target.value)}>
                  {!f.required && <option value="">—</option>}
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type ?? 'text'} step={f.type === 'number' ? 'any' : undefined} {...common} value={String(values[f.name])} onChange={(e) => set(e.target.value)} />
              )}
            </Field>
          );
        })}
        <div className="field-wide"><FormError message={action.error} /></div>
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={action.busy} disabled={uploading}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
