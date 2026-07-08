import type {
  ProjectKnowledgeBase,
  ProjectMemberRecord,
  ProjectRecord,
} from '@/features/project/api/project.api';

export function toProjectRecord(raw: Record<string, unknown>): ProjectRecord {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    code: String(raw.code ?? ''),
    description: raw.description ? String(raw.description) : undefined,
    status: String(raw.status ?? 'planning'),
    priority: String(raw.priority ?? 'medium'),
    projectKind: raw.projectKind ? String(raw.projectKind) : undefined,
    startDate: raw.startDate ? String(raw.startDate) : undefined,
    endDate: raw.endDate ? String(raw.endDate) : undefined,
    targetDate: raw.targetDate ? String(raw.targetDate) : undefined,
    projectManagerId: String(raw.projectManagerId ?? ''),
    clientName: raw.clientName ? String(raw.clientName) : undefined,
    requirements: raw.requirements ? String(raw.requirements) : undefined,
    uiDocs: raw.uiDocs ? String(raw.uiDocs) : undefined,
    scalabilityNotes: raw.scalabilityNotes ? String(raw.scalabilityNotes) : undefined,
    isArchived: Boolean(raw.isArchived),
    logoUrl: raw.logoUrl ? String(raw.logoUrl) : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    repositoryUrl: raw.repositoryUrl ? String(raw.repositoryUrl) : undefined,
    productionUrl: raw.productionUrl ? String(raw.productionUrl) : undefined,
    stagingUrl: raw.stagingUrl ? String(raw.stagingUrl) : undefined,
  };
}

export function toProjectMembers(raw: Record<string, unknown>[]): ProjectMemberRecord[] {
  return raw.map((member) => ({
    id: String(member.id ?? ''),
    projectId: String(member.projectId ?? ''),
    employeeId: String(member.employeeId ?? ''),
    role: String(member.role ?? 'member'),
    allocationPercent:
      typeof member.allocationPercent === 'number' ? member.allocationPercent : undefined,
    joinedAt: member.joinedAt ? String(member.joinedAt) : undefined,
    employeeName: member.employeeName ? String(member.employeeName) : undefined,
    employeeEmail: member.employeeEmail ? String(member.employeeEmail) : undefined,
    employeeNumber: member.employeeNumber ? String(member.employeeNumber) : undefined,
  }));
}

export function toProjectKnowledgeBase(
  knowledgeBase: ProjectKnowledgeBase | null | undefined,
  project: ProjectRecord,
): ProjectKnowledgeBase | null {
  if (!knowledgeBase && !project.repositoryUrl && !project.productionUrl && !project.stagingUrl) {
    return null;
  }

  return {
    repositoryUrl: knowledgeBase?.repositoryUrl ?? project.repositoryUrl,
    branches: knowledgeBase?.branches,
    apiDocsUrl: knowledgeBase?.apiDocsUrl,
    swaggerUrl: knowledgeBase?.swaggerUrl,
    envVariables: knowledgeBase?.envVariables,
    deploymentGuide: knowledgeBase?.deploymentGuide,
    architectureNotes: knowledgeBase?.architectureNotes,
    cloudflareEmail: knowledgeBase?.cloudflareEmail,
    devHostingPlatform: knowledgeBase?.devHostingPlatform,
    prodHostingPlatform: knowledgeBase?.prodHostingPlatform,
    documentUrls: knowledgeBase?.documentUrls,
  };
}
