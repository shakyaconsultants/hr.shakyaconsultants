import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERN: 'intern',
  PROBATION: 'probation',
} as const;

export const EMPLOYEE_EMPLOYMENT_STATUS = {
  ACTIVE: 'active',
  PROBATION: 'probation',
  CONFIRMED: 'confirmed',
  TERMINATED: 'terminated',
  RESIGNED: 'resigned',
  ON_LEAVE: 'on_leave',
} as const;

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

export const DOCUMENT_TYPE = {
  PROFILE_PHOTO: 'profile_photo',
  RESUME: 'resume',
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  TENTH: '10th',
  TWELFTH: '12th',
  GRADUATION: 'graduation',
  EXPERIENCE_LETTER: 'experience_letter',
  CERTIFICATE: 'certificate',
  OFFER_LETTER: 'offer_letter',
  JOINING_LETTER: 'joining_letter',
  CANCELLED_CHEQUE: 'cancelled_cheque',
  PAYSLIP: 'payslip',
  OTHER: 'other',
} as const;

export const ASSET_TYPE = {
  LAPTOP: 'laptop',
  MOUSE: 'mouse',
  MONITOR: 'monitor',
  PHONE: 'phone',
  ID_CARD: 'id_card',
  ACCESS_CARD: 'access_card',
  SOFTWARE_LICENSE: 'software_license',
  OTHER: 'other',
} as const;

export const ASSET_STATUS = {
  ASSIGNED: 'assigned',
  RETURNED: 'returned',
  LOST: 'lost',
  DAMAGED: 'damaged',
} as const;

export interface AddressDocument {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmployeeDocument extends BaseDocument {
  employeeNumber: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  photoPublicId?: string;
  dateOfBirth?: Date;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  maritalStatus?: string;
  languages: string[];
  permanentAddress?: AddressDocument;
  communicationAddress?: AddressDocument;
  aadhaarNumber?: string;
  panNumber?: string;
  departmentId: string;
  designationId: string;
  branchId?: string;
  officeLocationId?: string;
  shiftId?: string;
  employmentTypeId?: string;
  reportingManagerId?: string;
  dottedManagerId?: string;
  joinedAt: Date;
  probationEndDate?: Date;
  confirmationDate?: Date;
  terminatedAt?: Date;
  employmentType: string;
  employmentStatus: string;
  status: string;
  lifecycleEmails?: EmployeeLifecycleEmails;
}

export interface EmployeeEmailDeliverySnapshot {
  lastSentAt?: Date;
  lastSentBy?: string;
  sendCount: number;
  lastError?: string;
}

export interface EmployeeLifecycleEmails {
  accountActivation?: EmployeeEmailDeliverySnapshot;
  onboardingPortal?: EmployeeEmailDeliverySnapshot;
  passwordReset?: EmployeeEmailDeliverySnapshot;
}

export interface EmergencyContactDocument extends BaseDocument {
  employeeId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
}

export interface EducationDocument extends BaseDocument {
  employeeId: string;
  institution: string;
  university?: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: Date;
  endDate?: Date;
  year?: number;
  grade?: string;
  percentage?: number;
  cgpa?: number;
  documentId?: string;
}

export interface ExperienceDocument extends BaseDocument {
  employeeId: string;
  company: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  responsibilities?: string;
  experienceLetterDocumentId?: string;
}

export interface BankDetailsDocument extends BaseDocument {
  employeeId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
  branchName?: string;
  cancelledChequeUrl?: string;
  cancelledChequePublicId?: string;
  verificationStatus: string;
  isPrimary: boolean;
  status: string;
}

export interface EmployeeDocumentFileDocument extends BaseDocument {
  employeeId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  publicId: string;
  mimeType: string;
  fileSize: number;
  version: number;
  isLatest: boolean;
  expiryDate?: Date;
  uploadedBy: string;
  verificationStatus: string;
  status: string;
}

export interface AssetDocument extends BaseDocument {
  employeeId: string;
  assetType: string;
  assetTag: string;
  name: string;
  condition?: string;
  assignedAt: Date;
  returnedAt?: Date;
  status: string;
}

export const REPORTING_RELATIONSHIP_TYPE = {
  DIRECT: 'direct',
  DOTTED_LINE: 'dotted_line',
  DEPARTMENT_HEAD: 'department_head',
  BRANCH_HEAD: 'branch_head',
  MANAGER: 'manager',
  MENTOR: 'mentor',
  BUDDY: 'buddy',
} as const;

export interface ReportingHierarchyDocument extends BaseDocument {
  employeeId: string;
  managerId: string;
  relationshipType: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isPrimary: boolean;
}

const addressSubSchema = {
  line1: { type: String, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true },
};

const employeeFields: SchemaDefinition = {
  employeeNumber: { type: String, required: true, trim: true, uppercase: true, immutable: true },
  userId: { type: String, index: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  photoUrl: { type: String, trim: true },
  photoPublicId: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: Object.values(GENDER) },
  bloodGroup: { type: String, trim: true },
  nationality: { type: String, trim: true },
  maritalStatus: { type: String, trim: true },
  languages: { type: [String], default: [] },
  permanentAddress: addressSubSchema,
  communicationAddress: addressSubSchema,
  aadhaarNumber: { type: String, trim: true },
  panNumber: { type: String, trim: true, uppercase: true },
  departmentId: { type: String, required: true, index: true },
  designationId: { type: String, required: true, index: true },
  branchId: { type: String, index: true },
  officeLocationId: { type: String, index: true },
  shiftId: { type: String, index: true },
  employmentTypeId: { type: String, index: true },
  reportingManagerId: { type: String, index: true },
  dottedManagerId: { type: String, index: true },
  joinedAt: { type: Date, required: true },
  probationEndDate: { type: Date },
  confirmationDate: { type: Date },
  terminatedAt: { type: Date },
  employmentType: { type: String, enum: Object.values(EMPLOYMENT_TYPE), default: EMPLOYMENT_TYPE.FULL_TIME },
  employmentStatus: { type: String, enum: Object.values(EMPLOYEE_EMPLOYMENT_STATUS), default: EMPLOYEE_EMPLOYMENT_STATUS.ACTIVE },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
  lifecycleEmails: { type: Schema.Types.Mixed, default: {} },
};

const emergencyContactFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  relationship: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  isPrimary: { type: Boolean, default: false },
};

const educationFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  institution: { type: String, required: true, trim: true },
  university: { type: String, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  year: { type: Number, min: 1900, max: 2100 },
  grade: { type: String, trim: true },
  percentage: { type: Number, min: 0, max: 100 },
  cgpa: { type: Number, min: 0, max: 10 },
  documentId: { type: String, index: true },
};

const experienceFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  company: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  description: { type: String, trim: true },
  responsibilities: { type: String, trim: true },
  experienceLetterDocumentId: { type: String, index: true },
};

const bankDetailsFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  accountHolderName: { type: String, required: true, trim: true },
  bankName: { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true, trim: true, uppercase: true },
  upiId: { type: String, trim: true },
  branchName: { type: String, trim: true },
  cancelledChequeUrl: { type: String, trim: true },
  cancelledChequePublicId: { type: String, trim: true },
  verificationStatus: { type: String, default: 'pending' },
  isPrimary: { type: Boolean, default: false },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const employeeDocumentFileFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  documentType: { type: String, required: true, trim: true },
  fileName: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 0 },
  version: { type: Number, default: 1, min: 1 },
  isLatest: { type: Boolean, default: true },
  expiryDate: { type: Date, index: true },
  uploadedBy: { type: String, required: true },
  verificationStatus: { type: String, default: 'pending' },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
};

const assetFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  assetType: { type: String, required: true, trim: true },
  assetTag: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  condition: { type: String, trim: true },
  assignedAt: { type: Date, required: true, default: Date.now },
  returnedAt: { type: Date },
  status: { type: String, enum: Object.values(ASSET_STATUS), default: ASSET_STATUS.ASSIGNED },
};

const reportingHierarchyFields: SchemaDefinition = {
  employeeId: { type: String, required: true, index: true },
  managerId: { type: String, required: true, index: true },
  relationshipType: {
    type: String,
    enum: Object.values(REPORTING_RELATIONSHIP_TYPE),
    default: REPORTING_RELATIONSHIP_TYPE.DIRECT,
    index: true,
  },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  isPrimary: { type: Boolean, default: true },
};

export const employeeModel = defineDomainModel<EmployeeDocument>(
  'Employee',
  COLLECTIONS.EMPLOYEES,
  employeeFields,
  {
    searchFields: ['firstName', 'lastName', 'employeeNumber', 'email'],
    indexes: [
      { fields: { companyId: 1, employeeNumber: 1 }, options: { unique: true, name: 'uq_employees_company_number' } },
      { fields: { companyId: 1, email: 1 }, options: { unique: true, name: 'uq_employees_company_email', partialFilterExpression: { status: 'active', isDeleted: false } } },
      { fields: { companyId: 1, aadhaarNumber: 1 }, options: { unique: true, name: 'uq_employees_company_aadhaar', partialFilterExpression: { aadhaarNumber: { $gt: '' } } } },
      { fields: { companyId: 1, panNumber: 1 }, options: { unique: true, name: 'uq_employees_company_pan', partialFilterExpression: { panNumber: { $gt: '' } } } },
      { fields: { companyId: 1, status: 1, departmentId: 1 }, options: { name: 'idx_employees_company_status_dept' } },
      { fields: { companyId: 1, reportingManagerId: 1, status: 1 }, options: { name: 'idx_employees_company_manager_status' } },
      { fields: { companyId: 1, departmentId: 1, lastName: 1, firstName: 1 }, options: { name: 'idx_employees_company_dept_name' } },
    ],
  },
);

export const emergencyContactModel = defineDomainModel<EmergencyContactDocument>(
  'EmergencyContact',
  COLLECTIONS.EMERGENCY_CONTACTS,
  emergencyContactFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { name: 'idx_emergency_contacts_company_employee' } },
      { fields: { companyId: 1, employeeId: 1, isPrimary: 1 }, options: { name: 'idx_emergency_contacts_company_employee_primary' } },
    ],
  },
);

export const educationModel = defineDomainModel<EducationDocument>(
  'Education',
  COLLECTIONS.EDUCATIONS,
  educationFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { name: 'idx_educations_company_employee' } },
    ],
  },
);

export const experienceModel = defineDomainModel<ExperienceDocument>(
  'Experience',
  COLLECTIONS.EXPERIENCES,
  experienceFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { name: 'idx_experiences_company_employee' } },
    ],
  },
);

export const bankDetailsModel = defineDomainModel<BankDetailsDocument>(
  'BankDetails',
  COLLECTIONS.BANK_DETAILS,
  bankDetailsFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { name: 'idx_bank_details_company_employee' } },
      { fields: { companyId: 1, employeeId: 1, isPrimary: 1 }, options: { name: 'idx_bank_details_company_employee_primary' } },
    ],
  },
);

export const employeeDocumentFileModel = defineDomainModel<EmployeeDocumentFileDocument>(
  'EmployeeDocumentFile',
  COLLECTIONS.EMPLOYEE_DOCUMENTS,
  employeeDocumentFileFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1 }, options: { name: 'idx_employee_documents_company_employee' } },
      { fields: { companyId: 1, employeeId: 1, documentType: 1 }, options: { name: 'idx_employee_documents_company_employee_type' } },
      { fields: { companyId: 1, expiryDate: 1 }, options: { name: 'idx_employee_documents_company_expiry', sparse: true } },
    ],
  },
);

export const assetModel = defineDomainModel<AssetDocument>(
  'Asset',
  COLLECTIONS.ASSETS,
  assetFields,
  {
    indexes: [
      { fields: { companyId: 1, assetTag: 1 }, options: { unique: true, name: 'uq_assets_company_tag' } },
      { fields: { companyId: 1, employeeId: 1, status: 1 }, options: { name: 'idx_assets_company_employee_status' } },
    ],
  },
);

export const reportingHierarchyModel = defineDomainModel<ReportingHierarchyDocument>(
  'ReportingHierarchy',
  COLLECTIONS.REPORTING_HIERARCHIES,
  reportingHierarchyFields,
  {
    indexes: [
      { fields: { companyId: 1, employeeId: 1, effectiveFrom: -1 }, options: { name: 'idx_reporting_hierarchies_company_employee_date' } },
      { fields: { companyId: 1, managerId: 1, isPrimary: 1 }, options: { name: 'idx_reporting_hierarchies_company_manager_primary' } },
    ],
  },
);

export const EmployeeModel = employeeModel.model;
export const EmergencyContactModel = emergencyContactModel.model;
export const EducationModel = educationModel.model;
export const ExperienceModel = experienceModel.model;
export const BankDetailsModel = bankDetailsModel.model;
export const EmployeeDocumentFileModel = employeeDocumentFileModel.model;
export const AssetModel = assetModel.model;
export const ReportingHierarchyModel = reportingHierarchyModel.model;

export const EmployeeRepository = employeeModel.repository;
export const EmergencyContactRepository = emergencyContactModel.repository;
export const EducationRepository = educationModel.repository;
export const ExperienceRepository = experienceModel.repository;
export const BankDetailsRepository = bankDetailsModel.repository;
export const EmployeeDocumentFileRepository = employeeDocumentFileModel.repository;
export const AssetRepository = assetModel.repository;
export const ReportingHierarchyRepository = reportingHierarchyModel.repository;
