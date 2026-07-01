import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
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

function pickNonEmpty(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
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

    if (personal) {
      const updates = pickNonEmpty(personal, PERSONAL_FIELDS);
      if (updates.aadhaarNumber) {
        await EmployeeValidationService.assertUniqueAadhaar(
          companyId,
          String(updates.aadhaarNumber),
          employeeId,
        );
      }
      if (updates.panNumber) {
        await EmployeeValidationService.assertUniquePan(companyId, String(updates.panNumber), employeeId);
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
      const contacts = Array.isArray(emergency.contacts) ? emergency.contacts : [emergency];
      for (const entry of contacts) {
        const contact = asRecord(entry);
        if (!contact?.name || !contact.phone) {
          continue;
        }
        await EmployeeSubresourceService.createEmergencyContact(
          { companyId, userId: updatedBy },
          employeeId,
          {
            name: String(contact.name),
            relationship: String(contact.relationship ?? 'Other'),
            phone: String(contact.phone),
            email: typeof contact.email === 'string' ? contact.email : undefined,
            isPrimary: contact.isPrimary === true,
          },
        );
      }
    }

    if (bank) {
      const accounts = Array.isArray(bank.accounts) ? bank.accounts : [bank];
      for (const entry of accounts) {
        const details = asRecord(entry);
        if (!details?.accountNumber || !details.bankName || !details.ifscCode || !details.accountHolderName) {
          continue;
        }
        await EmployeeSubresourceService.createBankDetails(
          { companyId, userId: updatedBy },
          employeeId,
          {
            accountHolderName: String(details.accountHolderName),
            bankName: String(details.bankName),
            accountNumber: String(details.accountNumber),
            ifscCode: String(details.ifscCode),
            upiId: typeof details.upiId === 'string' ? details.upiId : undefined,
            branchName: typeof details.branchName === 'string' ? details.branchName : undefined,
            isPrimary: details.isPrimary === true,
          },
        );
      }
    }
  },
};
