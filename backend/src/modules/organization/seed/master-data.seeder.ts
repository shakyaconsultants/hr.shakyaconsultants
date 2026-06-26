import {
  AppSettingRepository,
  EmploymentTypeRepository,
  LeaveTypeRepository,
  SETTING_GROUP,
  SETTING_VALUE_TYPE,
  SkillRepository,
} from '@domain/master-data/master-data.schemas.js';
import { registerSeeder } from '@infrastructure/database/seed/seed.registry.js';
import { CompanyRepository } from '@domain/company/company.schema.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { databaseLogger } from '@logging/winston.logger.js';

const SYSTEM_ACTOR = 'system';
const MASTER_DATA_SEEDER = 'master_data';

const DEFAULT_EMPLOYMENT_TYPES = [
  { code: 'FT', name: 'Full Time', isDefault: true },
  { code: 'PT', name: 'Part Time', isDefault: false },
  { code: 'CONTRACT', name: 'Contract', isDefault: false },
  { code: 'INTERN', name: 'Intern', isDefault: false },
  { code: 'PROBATION', name: 'Probation', isDefault: false },
];

const DEFAULT_LEAVE_TYPES = [
  { code: 'CL', name: 'Casual Leave', isPaid: true, maxDaysPerYear: 12, isDefault: true, color: '#3B82F6' },
  { code: 'SL', name: 'Sick Leave', isPaid: true, maxDaysPerYear: 10, isDefault: true, color: '#EF4444' },
  { code: 'EL', name: 'Earned Leave', isPaid: true, maxDaysPerYear: 15, carryForward: true, isDefault: true, color: '#10B981' },
  { code: 'LOP', name: 'Loss of Pay', isPaid: false, isDefault: true, color: '#6B7280' },
];

const DEFAULT_SKILLS = [
  { code: 'COMM', name: 'Communication', category: 'Soft Skills' },
  { code: 'LEAD', name: 'Leadership', category: 'Soft Skills' },
  { code: 'PROB', name: 'Problem Solving', category: 'Soft Skills' },
  { code: 'TS', name: 'TypeScript', category: 'Technical' },
  { code: 'NODE', name: 'Node.js', category: 'Technical' },
  { code: 'REACT', name: 'React', category: 'Technical' },
  { code: 'SQL', name: 'SQL', category: 'Technical' },
  { code: 'PM', name: 'Project Management', category: 'Management' },
];

const DEFAULT_SETTINGS: Array<{
  key: string;
  value: unknown;
  valueType: string;
  group: string;
  description: string;
  isPublic: boolean;
}> = [
  {
    key: 'app.name',
    value: 'HR Shakya ERP',
    valueType: SETTING_VALUE_TYPE.STRING,
    group: SETTING_GROUP.GENERAL,
    description: 'Application display name',
    isPublic: true,
  },
  {
    key: 'app.timezone',
    value: 'Asia/Kolkata',
    valueType: SETTING_VALUE_TYPE.STRING,
    group: SETTING_GROUP.GENERAL,
    description: 'Default application timezone',
    isPublic: true,
  },
  {
    key: 'attendance.grace_minutes',
    value: 15,
    valueType: SETTING_VALUE_TYPE.NUMBER,
    group: SETTING_GROUP.ATTENDANCE,
    description: 'Default grace period in minutes',
    isPublic: false,
  },
  {
    key: 'payroll.currency',
    value: 'INR',
    valueType: SETTING_VALUE_TYPE.STRING,
    group: SETTING_GROUP.PAYROLL,
    description: 'Default payroll currency',
    isPublic: false,
  },
  {
    key: 'leave.year_start_month',
    value: 1,
    valueType: SETTING_VALUE_TYPE.NUMBER,
    group: SETTING_GROUP.LEAVE,
    description: 'Leave year start month (1-12)',
    isPublic: false,
  },
  {
    key: 'projects.default_statuses',
    value: ['draft', 'active', 'on_hold', 'completed', 'cancelled'],
    valueType: SETTING_VALUE_TYPE.JSON,
    group: SETTING_GROUP.PROJECTS,
    description: 'Default project status options',
    isPublic: false,
  },
  {
    key: 'projects.task_priorities',
    value: ['low', 'medium', 'high', 'critical'],
    valueType: SETTING_VALUE_TYPE.JSON,
    group: SETTING_GROUP.PROJECTS,
    description: 'Default task priority options',
    isPublic: false,
  },
  {
    key: 'security.password_min_length',
    value: 8,
    valueType: SETTING_VALUE_TYPE.NUMBER,
    group: SETTING_GROUP.SECURITY,
    description: 'Minimum password length',
    isPublic: false,
  },
  {
    key: 'branding.primary_color',
    value: '#2563EB',
    valueType: SETTING_VALUE_TYPE.STRING,
    group: SETTING_GROUP.BRANDING,
    description: 'Primary brand color',
    isPublic: true,
  },
];

async function resolveCompanyId(fallbackCompanyId: string): Promise<string | null> {
  if (fallbackCompanyId !== 'system') {
    return fallbackCompanyId;
  }
  const companies = await CompanyRepository.findMany({}, {});
  return companies[0]?.id ?? null;
}

async function seedEmploymentTypes(companyId: string): Promise<void> {
  for (const item of DEFAULT_EMPLOYMENT_TYPES) {
    const exists = await EmploymentTypeRepository.findOne({ code: item.code }, { companyId });
    if (exists) {
      continue;
    }
    await EmploymentTypeRepository.create(
      {
        id: generateUuid(),
        companyId,
        ...item,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }
}

async function seedLeaveTypes(companyId: string): Promise<void> {
  for (const item of DEFAULT_LEAVE_TYPES) {
    const exists = await LeaveTypeRepository.findOne({ code: item.code }, { companyId });
    if (exists) {
      continue;
    }
    await LeaveTypeRepository.create(
      {
        id: generateUuid(),
        companyId,
        carryForward: false,
        ...item,
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }
}

async function seedSkills(companyId: string): Promise<void> {
  for (const item of DEFAULT_SKILLS) {
    const exists = await SkillRepository.findOne({ code: item.code }, { companyId });
    if (exists) {
      continue;
    }
    await SkillRepository.create(
      {
        id: generateUuid(),
        companyId,
        ...item,
        technologyIds: [],
        status: ENTITY_STATUS.ACTIVE,
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }
}

async function seedSettings(companyId: string): Promise<void> {
  for (const item of DEFAULT_SETTINGS) {
    const exists = await AppSettingRepository.findOne({ key: item.key }, { companyId });
    if (exists) {
      continue;
    }
    await AppSettingRepository.create(
      {
        id: generateUuid(),
        companyId,
        ...item,
        isEditable: true,
        encrypted: false,
        validation: {},
        createdBy: SYSTEM_ACTOR,
        updatedBy: SYSTEM_ACTOR,
      },
      { companyId },
    );
  }
}

registerSeeder({
  name: MASTER_DATA_SEEDER,
  order: 3,
  run: async (context) => {
    const companyId = await resolveCompanyId(context.companyId);
    if (!companyId) {
      databaseLogger.info('No company found — master data seed skipped');
      return;
    }

    await seedEmploymentTypes(companyId);
    await seedLeaveTypes(companyId);
    await seedSkills(companyId);
    await seedSettings(companyId);
  },
});
