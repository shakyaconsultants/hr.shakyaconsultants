import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { AppSetting } from '@/features/configuration/api/configuration.api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface SettingFieldEditorProps {
  setting: AppSetting;
  value: unknown;
  disabled?: boolean;
  onChange: (value: unknown) => void;
}

function coerceValue(raw: string, valueType: string): unknown {
  switch (valueType) {
    case 'number':
      return raw === '' ? null : Number(raw);
    case 'boolean':
      return raw === 'true' || raw === '1';
    case 'json':
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default:
      return raw;
  }
}

export function SettingFieldEditor({ setting, value, disabled = false, onChange }: SettingFieldEditorProps) {
  const [revealed, setRevealed] = useState(false);
  const isEncrypted = setting.valueType === 'encrypted' || String(setting.key).includes('secret');
  const isBoolean = setting.valueType === 'boolean';
  const isJson = setting.valueType === 'json' || typeof value === 'object';

  if (isBoolean) {
    return (
      <label className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled || !setting.isEditable}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm">{Boolean(value) ? 'Enabled' : 'Disabled'}</span>
      </label>
    );
  }

  if (isJson) {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2);
    return (
      <textarea
        className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
        value={text}
        disabled={disabled || !setting.isEditable}
        onChange={(e) => onChange(coerceValue(e.target.value, 'json'))}
      />
    );
  }

  if (isEncrypted) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type={revealed ? 'text' : 'password'}
          value={String(value ?? '')}
          disabled={disabled || !setting.isEditable}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="font-mono"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRevealed((v) => !v)}
          disabled={disabled}
          aria-label={revealed ? 'Hide value' : 'Reveal value'}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  if (setting.valueType === 'number') {
    return (
      <Input
        type="number"
        value={value === null || value === undefined ? '' : String(value)}
        disabled={disabled || !setting.isEditable}
        onChange={(e) => onChange(coerceValue(e.target.value, 'number'))}
      />
    );
  }

  return (
    <Input
      value={String(value ?? '')}
      disabled={disabled || !setting.isEditable}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
