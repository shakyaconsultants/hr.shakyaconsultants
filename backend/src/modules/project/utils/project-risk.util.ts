import type { ProjectDocument } from '@domain/project/project.schemas.js';
import { PROJECT_RISK_LEVEL } from '@domain/project/project-extended.schemas.js';
import { PROJECT_STATUS } from '@shared/constants/status.constants.js';

export function isProjectAtRisk(
  project: Pick<ProjectDocument, 'riskLevel' | 'targetDate' | 'status'>,
  now: Date = new Date(),
): boolean {
  return (
    project.riskLevel === PROJECT_RISK_LEVEL.HIGH
    || project.riskLevel === PROJECT_RISK_LEVEL.CRITICAL
    || project.riskLevel === PROJECT_RISK_LEVEL.MEDIUM
    || Boolean(project.targetDate && project.targetDate < now && project.status !== PROJECT_STATUS.COMPLETED)
  );
}
