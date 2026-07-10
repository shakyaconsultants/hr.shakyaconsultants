import {
  EmployeeRepository,
  EmergencyContactRepository,
  BankDetailsRepository,
  EducationRepository,
} from '@domain/employee/employee.schemas.js';
import { EmployeeValidationService } from '@modules/employee/services/employee-validation.service.js';
import { EmployeeSubresourceService } from '@modules/employee/services/employee-profile.service.js';

const PERSONAL_FIELDS = [
  'dateOfBirth',
  'gender',
  'bloodGroup',
  'nationality',
  'maritalStatus',
  'aadhaarNumber',
  'panNumber',
  'phone',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}

function pickNonEmpty(
  source: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of keys) {
    const value = source[key];
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }
    picked[key] = value;
  }
  return picked;
}

export const EmployeeOnboardingApplyService = {
  async applyFormData(
    companyId: string,
    employeeId: string,
    formData: Record<string, unknown>,
    updatedBy: string,
  ): Promise<void> {
    const personal = asRecord(formData.personal);
    const address = asRecord(formData.address);
    const emergency = asRecord(formData.emergency) ?? asRecord(formData.emergency_contact);
    const bank = asRecord(formData.bank) ?? asRecord(formData.bank_details);
    const documents = asRecord(formData.documents);

    const actor = { companyId, userId: updatedBy };

    if (personal) {
      const updates = pickNonEmpty(personal, PERSONAL_FIELDS);
      const aadhaarNumber = asString(updates.aadhaarNumber);
      const panNumber = asString(updates.panNumber);
      if (aadhaarNumber) {
        await EmployeeValidationService.assertUniqueAadhaar(companyId, aadhaarNumber, employeeId);
        updates.aadhaarNumber = aadhaarNumber;
      }
      if (panNumber) {
        await EmployeeValidationService.assertUniquePan(companyId, panNumber, employeeId);
        updates.panNumber = panNumber;
      }
      const dateOfBirth = asString(updates.dateOfBirth);
      if (dateOfBirth) {
        updates.dateOfBirth = new Date(dateOfBirth);
      }
      if (Object.keys(updates).length > 0) {
        await EmployeeRepository.update(employeeId, { ...updates, updatedBy }, { companyId });
      }
    }

    if (address) {
      const updates: Record<string, unknown> = {};
      if (address.permanentAddress) {
        updates.permanentAddress = address.permanentAddress;
      }
      if (address.communicationAddress) {
        updates.communicationAddress = address.communicationAddress;
      }
      if (Object.keys(updates).length > 0) {
        await EmployeeRepository.update(employeeId, { ...updates, updatedBy }, { companyId });
      }
    }

    if (emergency) {
      const emergencyName = asString(emergency.name);
      const emergencyPhone = asString(emergency.phone);
      if (emergencyName && emergencyPhone) {
        const payload = {
          name: emergencyName,
          relationship: asString(emergency.relationship) || 'Other',
          phone: emergencyPhone,
          email: typeof emergency.email === 'string' ? emergency.email : undefined,
          isPrimary: true,
        };
        const existing = await EmergencyContactRepository.findMany({ employeeId }, { companyId });
        if (existing.length > 0) {
          const primary = existing.find((item) => item.isPrimary) ?? existing[0];
          await EmergencyContactRepository.update(
            primary.id,
            { ...payload, updatedBy },
            { companyId },
          );
        } else {
          await EmployeeSubresourceService.createEmergencyContact(actor, employeeId, payload);
        }
      }
    }

    if (bank) {
      const accountHolderName = asString(bank.accountHolderName);
      const bankName = asString(bank.bankName);
      const accountNumber = asString(bank.accountNumber);
      const ifscCode = asString(bank.ifscCode);
      if (accountHolderName && bankName && accountNumber && ifscCode) {
        const payload = {
          accountHolderName,
          bankName,
          accountNumber,
          ifscCode,
          upiId: typeof bank.upiId === 'string' ? bank.upiId : undefined,
          branchName: typeof bank.branchName === 'string' ? bank.branchName : undefined,
          isPrimary: true,
        };
        const existing = await BankDetailsRepository.findMany({ employeeId }, { companyId });
        if (existing.length > 0) {
          const primary = existing.find((item) => item.isPrimary) ?? existing[0];
          await BankDetailsRepository.update(primary.id, { ...payload, updatedBy }, { companyId });
        } else {
          await EmployeeSubresourceService.createBankDetails(actor, employeeId, payload);
        }
      }
    }

    if (documents) {
      const institution = asString(documents.institution) || 'Not specified';
      const degree = asString(documents.degree) || 'Not specified';
      if (institution !== 'Not specified' || degree !== 'Not specified') {
        const yearRaw = documents.year;
        const year =
          typeof yearRaw === 'number'
            ? yearRaw
            : typeof yearRaw === 'string' && yearRaw.trim()
              ? Number(yearRaw)
              : undefined;
        const startDate = year && !Number.isNaN(year) ? new Date(year, 0, 1) : new Date();
        const endDate = year && !Number.isNaN(year) ? new Date(year, 11, 31) : undefined;
        const educationPayload = {
          institution,
          degree,
          fieldOfStudy:
            typeof documents.fieldOfStudy === 'string' ? documents.fieldOfStudy : undefined,
          startDate,
          year: year && !Number.isNaN(year) ? year : undefined,
          endDate,
        };
        const existing = await EducationRepository.findMany({ employeeId }, { companyId });
        if (existing.length > 0) {
          await EducationRepository.update(
            existing[0].id,
            { ...educationPayload, updatedBy },
            { companyId },
          );
        } else {
          await EmployeeSubresourceService.createEducation(actor, employeeId, educationPayload);
        }
      }
    }
  },
};
