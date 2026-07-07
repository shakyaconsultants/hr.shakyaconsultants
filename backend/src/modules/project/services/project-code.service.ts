import { SequenceModel } from '@domain/employee/employee-subresource.schemas.js';
import { ProjectRepository } from '@domain/project/project.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

const SEQUENCE_KEY = 'project:code';
const DEFAULT_PREFIX = 'PRJ';
const MAX_CODE_LENGTH = 20;

function abbreviateProjectName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'GEN';
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const initials = words
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
    if (initials.length >= 2) {
      return initials.slice(0, 8);
    }
  }

  const compact = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return compact.slice(0, 8) || 'GEN';
}

async function nextSequenceValue(companyId: string, userId: string): Promise<number> {
  const sequence = await SequenceModel.findOneAndUpdate(
    { companyId, key: SEQUENCE_KEY },
    {
      $inc: { value: 1 },
      $setOnInsert: {
        id: generateUuid(),
        companyId,
        key: SEQUENCE_KEY,
        prefix: DEFAULT_PREFIX,
        createdBy: userId,
        updatedBy: userId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  return sequence.value;
}

function buildCandidateCode(abbrev: string, sequenceValue: number, attempt: number): string {
  const suffix = String(sequenceValue + attempt).padStart(3, '0');
  return `${DEFAULT_PREFIX}-${abbrev}-${suffix}`.slice(0, MAX_CODE_LENGTH);
}

export const ProjectCodeService = {
  async generateUnique(companyId: string, userId: string, name: string): Promise<string> {
    const abbrev = abbreviateProjectName(name);
    const sequenceValue = await nextSequenceValue(companyId, userId);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = buildCandidateCode(abbrev, sequenceValue, attempt);
      const existing = await ProjectRepository.findOne({ code }, { companyId });
      if (!existing) {
        return code;
      }
    }

    return `${DEFAULT_PREFIX}-${String(Date.now())}`.slice(0, MAX_CODE_LENGTH);
  },
};
