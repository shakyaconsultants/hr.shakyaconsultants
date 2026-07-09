import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchEmployeeDirectConversations,
  fetchMessages,
} from '@/features/communication/api/communication.api';
import { ConversationList } from '@/features/communication/components/conversation-list';
import { MessageThread } from '@/features/communication/components/message-thread';
import { useAllEmployees } from '@/features/employee/hooks/use-employees';
import { DataTable } from '@/shared/components/data-table';
import { Loading } from '@/shared/components/loading';
import { EmptyState } from '@/features/workspace/components/widget-primitives';
import type { Conversation } from '@/features/communication/api/communication.api';
import type { EmployeeRecord } from '@/features/employee/api/employee.api';
import {
  buildParticipantNameMap,
  getInitials,
  resolveParticipantName,
} from '@/features/communication/utils/participant.util';

export function EmployeeDmOversightPanel() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [search, setSearch] = useState('');

  const { data: employees, isLoading: employeesLoading } = useAllEmployees();

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees ?? [];
    return (employees ?? []).filter((employee) => {
      const name = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      return (
        name.includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.employeeNumber.toLowerCase().includes(query)
      );
    });
  }, [employees, search]);

  const participantNameMap = useMemo(() => buildParticipantNameMap(employees ?? []), [employees]);

  const selectedEmployeeIds = useMemo(() => {
    if (!selectedEmployee) return [];
    const ids = [selectedEmployee.id];
    if (selectedEmployee.userId) ids.push(selectedEmployee.userId);
    return ids;
  }, [selectedEmployee]);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['communication', 'employee-dms', selectedEmployee?.id],
    queryFn: () => fetchEmployeeDirectConversations(selectedEmployee!.id, { pageSize: 50 }),
    enabled: Boolean(selectedEmployee?.id),
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['communication', 'employee-dm-messages', selectedConversation?.id],
    queryFn: () => fetchMessages(selectedConversation!.id, { pageSize: 100 }),
    enabled: Boolean(selectedConversation?.id),
  });

  function getConversationLabel(conversation: Conversation) {
    if (conversation.peerDisplayName) return conversation.peerDisplayName;
    if (!selectedEmployee) return conversation.title ?? 'Direct message';
    const peerId = conversation.participantIds.find((id) => !selectedEmployeeIds.includes(id));
    return resolveParticipantName(peerId, participantNameMap, 'Unknown colleague');
  }

  const selectedEmployeeName = selectedEmployee
    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim()
    : '';

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <div>
          <h3 className="font-semibold">Employees</h3>
          <p className="text-sm text-muted-foreground">
            Select an employee to review their direct messages.
          </p>
        </div>
        <input
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Search by name, email, or ID…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {employeesLoading ? (
          <Loading message="Loading employees…" />
        ) : (
          <DataTable
            columns={[
              {
                key: 'name',
                header: 'Employee',
                render: (row: EmployeeRecord) => `${row.firstName} ${row.lastName}`.trim(),
              },
              { key: 'employeeNumber', header: 'ID' },
            ]}
            data={filteredEmployees}
            onRowClick={(row) => {
              setSelectedEmployee(row);
              setSelectedConversation(null);
            }}
            emptyMessage="No employees found"
          />
        )}
      </section>

      <section className="rounded-xl border bg-card">
        {!selectedEmployee ? (
          <EmptyState
            title="Select an employee"
            description="Choose someone from the list to view their direct message threads."
          />
        ) : (
          <div className="grid min-h-[520px] lg:grid-cols-[260px_1fr]">
            <div className="border-b lg:border-b-0 lg:border-r">
              <div className="border-b px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(selectedEmployeeName)}
                  </span>
                  <div>
                    <p className="font-medium">{selectedEmployeeName}</p>
                    <p className="text-xs text-muted-foreground">Read-only admin view</p>
                  </div>
                </div>
              </div>
              {conversationsLoading ? (
                <Loading message="Loading conversations…" />
              ) : (
                <ConversationList
                  conversations={conversations?.items ?? []}
                  selectedId={selectedConversation?.id}
                  onSelect={setSelectedConversation}
                  emptyMessage="This employee has no direct messages"
                  getLabel={getConversationLabel}
                />
              )}
            </div>
            <div className="flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="flex items-center gap-3 border-b px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {getInitials(getConversationLabel(selectedConversation))}
                    </span>
                    <p className="font-medium">{getConversationLabel(selectedConversation)}</p>
                  </div>
                  <MessageThread
                    messages={messages?.items ?? []}
                    senderNameMap={participantNameMap}
                    isLoading={messagesLoading}
                    readOnly
                  />
                  <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                    Admin oversight — you are viewing this conversation in read-only mode.
                  </p>
                </>
              ) : (
                <EmptyState
                  title="Select a conversation"
                  description="Pick a direct message thread to inspect messages."
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
