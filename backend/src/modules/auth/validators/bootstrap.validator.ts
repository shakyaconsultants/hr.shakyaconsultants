/** Input shape for one-time terminal seed (BootstrapService.bootstrapSystem). */
export interface BootstrapInput {
  company: {
    name: string;
    legalName: string;
    code: string;
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
  };
  branch?: {
    name?: string;
    code?: string;
    phone?: string;
    email?: string;
    address?: BootstrapInput['company']['address'];
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  };
}
