import { useState } from 'react';
import { Search } from 'lucide-react';
import { useDailyAttendanceRegister } from '@/features/attendance/hooks/use-attendance';
import {
  AttendanceStatusBadge,
  formatAttendanceTime,
  formatWorkedMinutes,
} from '@/features/attendance/components/attendance-status-badge';
import { DatePicker } from '@/shared/components/date-picker';
import { DataTable } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AttendanceDailyRegisterPanel() {
  const [date, setDate] = useState(todayIso);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDailyAttendanceRegister({
    date,
    search: search || undefined,
    page,
    pageSize: 50,
  });

  function applySearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="space-y-1">
          <span className="text-label-caps text-muted-foreground">Date</span>
          <DatePicker
            id="attendance-daily-date"
            value={date}
            onChange={(value) => {
              setDate(value);
              setPage(1);
            }}
            required
          />
        </label>
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-label-caps text-muted-foreground">Search employee</span>
          <div className="flex gap-2">
            <Input
              value={searchInput}
              placeholder="Name, employee ID, or email"
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  applySearch();
                }
              }}
            />
            <Button type="button" size="sm" className="shrink-0" onClick={applySearch}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </label>
      </div>

      <DataTable
        columns={[
          {
            key: 'employeeName',
            header: 'Employee',
            render: (row) => (
              <div>
                <p className="font-medium">{row.employeeName}</p>
                <p className="font-mono text-xs text-muted-foreground">{row.employeeNumber}</p>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <AttendanceStatusBadge status={row.status} />,
          },
          {
            key: 'checkIn',
            header: 'Punch In',
            render: (row) => formatAttendanceTime(row.checkIn),
          },
          {
            key: 'checkOut',
            header: 'Punch Out',
            render: (row) => formatAttendanceTime(row.checkOut),
          },
          {
            key: 'workedMinutes',
            header: 'Worked',
            render: (row) => formatWorkedMinutes(row.workedMinutes),
          },
          {
            key: 'lateMinutes',
            header: 'Late (min)',
            render: (row) =>
              row.lateMinutes != null && row.lateMinutes > 0 ? row.lateMinutes : '—',
          },
        ]}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No employees found for this date"
        getRowId={(row) => row.id}
        pagination={
          data?.pagination
            ? {
                page: data.pagination.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                pageSize: data.pagination.pageSize,
                onPageChange: setPage,
              }
            : undefined
        }
      />
    </section>
  );
}
