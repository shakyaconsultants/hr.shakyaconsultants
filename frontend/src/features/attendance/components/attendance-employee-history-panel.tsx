import { useMemo, useState } from 'react';
import { AttendanceCalendar } from '@/features/attendance/components/attendance-calendar';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { Loading } from '@/shared/components/loading';
import { SelectField } from '@/shared/components/select-field';
import { Select } from '@/shared/components/ui/select';

export function AttendanceEmployeeHistoryPanel() {
  const [employeeId, setEmployeeId] = useState('');
  const { data: employees, isLoading } = useAllEmployees({ status: 'active' });

  const sortedEmployees = useMemo(
    () =>
      [...(employees ?? [])].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
      ),
    [employees],
  );

  const selectedEmployee = sortedEmployees.find((employee) => employee.id === employeeId);

  if (isLoading) {
    return <Loading message="Loading employees..." />;
  }

  return (
    <section className="space-y-4">
      <div className="max-w-md">
        <SelectField label="Employee" htmlFor="attendance-history-employee" required>
          <Select
            id="attendance-history-employee"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
          >
            <option value="">Select employee...</option>
            {sortedEmployees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </Select>
        </SelectField>
      </div>

      {!employeeId ? (
        <p className="text-sm text-muted-foreground">
          Select an employee to view their attendance calendar.
        </p>
      ) : (
        <div className="space-y-3">
          {selectedEmployee ? (
            <p className="text-sm text-muted-foreground">
              Showing attendance for {selectedEmployee.firstName} {selectedEmployee.lastName} (
              {selectedEmployee.employeeNumber}). Use the arrows to browse any month.
            </p>
          ) : null}
          <AttendanceCalendar employeeId={employeeId} navigable />
        </div>
      )}
    </section>
  );
}
