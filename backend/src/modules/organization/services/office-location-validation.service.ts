import { BranchRepository } from '@domain/organization/organization.schemas.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { ConflictError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';

type AddressRecord = Record<string, unknown>;

const REMOTE_ADDRESS = {
  line1: 'Remote',
  line2: '',
  city: 'Remote',
  state: 'N/A',
  country: 'N/A',
  postalCode: '000000',
};

function readAddress(payload: Record<string, unknown>): AddressRecord {
  const raw = payload.address;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as AddressRecord;
  }
  return {};
}

function mergeAddress(existing: AddressRecord | undefined, incoming: AddressRecord): AddressRecord {
  return {
    ...(existing ?? {}),
    ...incoming,
  };
}

function normalizeAddress(address: AddressRecord, isRemote: boolean): AddressRecord {
  if (isRemote) {
    return { ...REMOTE_ADDRESS };
  }

  const line1 = typeof address.line1 === 'string' ? address.line1.trim() : '';
  const city = typeof address.city === 'string' ? address.city.trim() : '';
  const state = typeof address.state === 'string' ? address.state.trim() : '';
  const country = typeof address.country === 'string' ? address.country.trim() : '';
  const postalCode = typeof address.postalCode === 'string' ? address.postalCode.trim() : '';

  const missing: string[] = [];
  if (!line1) missing.push('Address Line 1');
  if (!city) missing.push('City');
  if (!state) missing.push('State');
  if (!country) missing.push('Country');
  if (!postalCode) missing.push('Postal Code');

  if (missing.length > 0) {
    throw new ConflictError(
      `Office location address is incomplete: ${missing.join(', ')}`,
      ERROR_CODES.VALIDATION_FAILED,
    );
  }

  return {
    line1,
    line2: typeof address.line2 === 'string' ? address.line2.trim() : undefined,
    city,
    state,
    country,
    postalCode,
  };
}

export const OfficeLocationValidationService = {
  async validateWrite(
    companyId: string,
    payload: Record<string, unknown>,
    existing?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const next: Record<string, unknown> = { ...payload };
    delete next.description;

    const isRemote = next.isRemote === true || next.isRemote === 'true';
    next.isRemote = isRemote;

    const mergedAddress = mergeAddress(
      existing ? readAddress(existing) : undefined,
      readAddress(next),
    );
    next.address = normalizeAddress(mergedAddress, isRemote);

    if (typeof next.branchId === 'string' && next.branchId.trim()) {
      const branch = await BranchRepository.findById(next.branchId.trim(), { companyId });
      if (!branch || branch.status !== ENTITY_STATUS.ACTIVE) {
        throw new NotFoundError('Branch must exist and be active', ERROR_CODES.NOT_FOUND);
      }
      next.branchId = next.branchId.trim();
    } else {
      delete next.branchId;
    }

    if (typeof next.timezone !== 'string' || !next.timezone.trim()) {
      next.timezone = typeof existing?.timezone === 'string' ? existing.timezone : 'Asia/Kolkata';
    }

    return next;
  },
};
