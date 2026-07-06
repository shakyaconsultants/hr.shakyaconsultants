import type { CandidateRecord } from '@/features/recruitment/api/recruitment.api';
import { formatWorkflowStage } from '@/features/recruitment/constants/recruitment-workflow.constants';
import { unwrapEntityPayload } from '@/shared/utils/api-normalize.util';

/** Normalize API/legacy candidate records so UI never crashes on missing fields. */
export function normalizeCandidate(
  raw: Partial<CandidateRecord> & { id?: string },
): CandidateRecord {
  const source = unwrapEntityPayload<Partial<CandidateRecord> & { id?: string }>(raw, [
    'candidate',
  ]);
  const firstName = String(source.firstName ?? '').trim();
  const lastName = String(source.lastName ?? '').trim();

  return {
    id: String(source.id ?? raw.id ?? ''),
    firstName: firstName || 'Unknown',
    lastName,
    email: String(source.email ?? '').trim(),
    phone: source.phone,
    pipelineStage: source.pipelineStage ?? 'lead',
    departmentId: source.departmentId,
    designationId: source.designationId,
    recruiterId: source.recruiterId,
    resumeUrl: source.resumeUrl,
    isArchived: source.isArchived ?? false,
    employeeId: source.employeeId,
    convertedAt: source.convertedAt,
    tags: Array.isArray(source.tags) ? source.tags : [],
    createdAt: source.createdAt ?? new Date().toISOString(),
    updatedAt: source.updatedAt ?? new Date().toISOString(),
  };
}

export function formatStage(slug?: string | null): string {
  return formatWorkflowStage(slug);
}

export function getCandidateDisplayName(
  candidate: Pick<CandidateRecord, 'firstName' | 'lastName' | 'email'>,
): string {
  const name = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim();
  return name || candidate.email || 'Unknown candidate';
}

export function getCandidateInitials(
  candidate: Pick<CandidateRecord, 'firstName' | 'lastName' | 'email'>,
): string {
  const first = candidate.firstName?.charAt(0) ?? '';
  const last = candidate.lastName?.charAt(0) ?? '';
  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }
  return (candidate.email?.charAt(0) ?? '?').toUpperCase();
}

export function formatInterviewType(type?: string | null): string {
  if (!type) return 'Interview';
  return type.replace(/_/g, ' ');
}

export function safeLocaleDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function safeLocaleDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
