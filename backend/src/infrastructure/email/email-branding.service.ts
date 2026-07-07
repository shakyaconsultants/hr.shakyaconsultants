import { CompanyRepository } from '@domain/company/company.schema.js';
import { getEnv } from '@config/env.js';

export interface CompanyEmailBranding {
  companyName: string;
  legalName?: string;
  logoUrl?: string;
  supportEmail?: string;
  phone?: string;
  website?: string;
  addressLine?: string;
  appName: string;
}

function formatAddress(address: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}): string {
  return [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');
}

export const EmailBrandingService = {
  getDefaultBranding(): CompanyEmailBranding {
    const env = getEnv();
    return {
      companyName: env.SMTP_FROM_NAME,
      appName: env.APP_NAME,
      supportEmail: env.SMTP_FROM_EMAIL,
    };
  },

  async getBranding(companyId: string): Promise<CompanyEmailBranding> {
    const env = getEnv();
    const company = await CompanyRepository.findById(companyId);
    if (!company) {
      return this.getDefaultBranding();
    }

    return {
      companyName: company.name,
      legalName: company.legalName !== company.name ? company.legalName : undefined,
      logoUrl: company.logoUrl,
      supportEmail: company.email || env.SMTP_FROM_EMAIL,
      phone: company.phone,
      website: company.website,
      addressLine: formatAddress(company.address),
      appName: env.APP_NAME,
    };
  },
};
