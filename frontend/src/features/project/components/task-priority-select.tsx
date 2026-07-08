import {
  DEFAULT_TASK_PRIORITY,
  TASK_PRIORITY_SELECT_OPTIONS,
} from '@/features/project/constants/task-priority';
import { Select } from '@/shared/components/ui/select';

interface TaskPrioritySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TaskPrioritySelect({ value, onChange, className }: TaskPrioritySelectProps) {
  return (
    <Select
      className={className}
      value={value || DEFAULT_TASK_PRIORITY}
      onChange={(e) => onChange(e.target.value)}
    >
      {TASK_PRIORITY_SELECT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
