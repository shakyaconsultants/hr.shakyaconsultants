import { Schema, type SchemaDefinition } from 'mongoose';
import { defineDomainModel } from '@infrastructure/database/model.factory.js';
import { COLLECTIONS } from '@infrastructure/database/constants/collections.js';
import type { BaseDocument } from '@infrastructure/database/types/base-document.types.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';

export interface CompanyDocument extends BaseDocument {
  name: string;
  legalName: string;
  slug: string;
  code: string;
  status: string;
  email: string;
  phone: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  timezone: string;
  currency: string;
  fiscalYearStart: string;
  logoUrl?: string;
  settings: Record<string, unknown>;
}

const companyFields: SchemaDefinition = {
  name: { type: String, required: true, trim: true },
  legalName: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  status: { type: String, enum: Object.values(ENTITY_STATUS), default: ENTITY_STATUS.ACTIVE },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  taxId: { type: String, trim: true },
  registrationNumber: { type: String, trim: true },
  address: {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  timezone: { type: String, default: 'Asia/Kolkata' },
  currency: { type: String, default: 'INR' },
  fiscalYearStart: { type: String, default: '04-01' },
  logoUrl: { type: String },
  settings: { type: Schema.Types.Mixed, default: {} },
};

export const companyModel = defineDomainModel<CompanyDocument>(
  'Company',
  COLLECTIONS.COMPANIES,
  companyFields,
  {
    withCompanyScope: false,
    slug: { sourceField: 'name' },
    searchFields: ['name', 'legalName', 'code', 'email'],
    indexes: [
      { fields: { slug: 1 }, options: { unique: true, name: 'uq_companies_slug' } },
      { fields: { code: 1 }, options: { unique: true, name: 'uq_companies_code' } },
      { fields: { status: 1 }, options: { name: 'idx_companies_status' } },
    ],
  },
);

export const CompanyModel = companyModel.model;
export const CompanyRepository = companyModel.repository;
