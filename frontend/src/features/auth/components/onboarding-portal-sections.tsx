import { Input } from '@/shared/components/ui/input';
import { SelectField } from '@/shared/components/select-field';

export type OnboardingSectionId = 'personal' | 'address' | 'bank' | 'emergency' | 'documents';

export interface AddressFields {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OnboardingFormState {
  personal: {
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    nationality: string;
    maritalStatus: string;
    phone: string;
    aadhaarNumber: string;
    panNumber: string;
  };
  address: {
    permanentAddress: AddressFields;
    communicationAddress: AddressFields;
    sameAsPermanent: boolean;
  };
  bank: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    branchName: string;
  };
  emergency: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  documents: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    year: string;
    notes: string;
  };
}

export const EMPTY_ADDRESS: AddressFields = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export function emptyOnboardingForm(): OnboardingFormState {
  return {
    personal: {
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      nationality: 'Indian',
      maritalStatus: '',
      phone: '',
      aadhaarNumber: '',
      panNumber: '',
    },
    address: {
      permanentAddress: { ...EMPTY_ADDRESS },
      communicationAddress: { ...EMPTY_ADDRESS },
      sameAsPermanent: true,
    },
    bank: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      branchName: '',
    },
    emergency: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
    },
    documents: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      year: '',
      notes: '',
    },
  };
}

function field(
  label: string,
  value: string,
  onChange: (v: string) => void,
  opts?: { type?: string; required?: boolean; placeholder?: string },
) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">
        {label}
        {opts?.required ? ' *' : ''}
      </span>
      <Input
        type={opts?.type ?? 'text'}
        value={value}
        placeholder={opts?.placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={opts?.required}
      />
    </label>
  );
}

function addressBlock(
  title: string,
  value: AddressFields,
  onChange: (next: AddressFields) => void,
) {
  return (
    <div className="space-y-3 rounded-md border p-4">
      <h4 className="font-medium">{title}</h4>
      {field('Address line 1', value.line1, (line1) => onChange({ ...value, line1 }), {
        required: true,
      })}
      {field('Address line 2', value.line2, (line2) => onChange({ ...value, line2 }))}
      <div className="grid gap-3 sm:grid-cols-2">
        {field('City', value.city, (city) => onChange({ ...value, city }), { required: true })}
        {field('State', value.state, (state) => onChange({ ...value, state }), { required: true })}
        {field(
          'Postal code',
          value.postalCode,
          (postalCode) => onChange({ ...value, postalCode }),
          {
            required: true,
          },
        )}
        {field('Country', value.country, (country) => onChange({ ...value, country }), {
          required: true,
        })}
      </div>
    </div>
  );
}

export function PersonalSection({
  value,
  onChange,
}: {
  value: OnboardingFormState['personal'];
  onChange: (v: OnboardingFormState['personal']) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field(
        'Date of birth',
        value.dateOfBirth,
        (dateOfBirth) => onChange({ ...value, dateOfBirth }),
        {
          type: 'date',
          required: true,
        },
      )}
      <SelectField label="Gender" required>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={value.gender}
          onChange={(e) => onChange({ ...value, gender: e.target.value })}
          required
        >
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </SelectField>
      {field('Phone', value.phone, (phone) => onChange({ ...value, phone }), { required: true })}
      {field('Blood group', value.bloodGroup, (bloodGroup) => onChange({ ...value, bloodGroup }))}
      {field('Nationality', value.nationality, (nationality) =>
        onChange({ ...value, nationality }),
      )}
      {field('Marital status', value.maritalStatus, (maritalStatus) =>
        onChange({ ...value, maritalStatus }),
      )}
      {field('Aadhaar number', value.aadhaarNumber, (aadhaarNumber) =>
        onChange({ ...value, aadhaarNumber }),
      )}
      {field('PAN number', value.panNumber, (panNumber) => onChange({ ...value, panNumber }))}
    </div>
  );
}

export function AddressSection({
  value,
  onChange,
}: {
  value: OnboardingFormState['address'];
  onChange: (v: OnboardingFormState['address']) => void;
}) {
  return (
    <div className="space-y-4">
      {addressBlock('Permanent address', value.permanentAddress, (permanentAddress) => {
        const next = { ...value, permanentAddress };
        if (value.sameAsPermanent) {
          next.communicationAddress = { ...permanentAddress };
        }
        onChange(next);
      })}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.sameAsPermanent}
          onChange={(e) => {
            const sameAsPermanent = e.target.checked;
            onChange({
              ...value,
              sameAsPermanent,
              communicationAddress: sameAsPermanent
                ? { ...value.permanentAddress }
                : value.communicationAddress,
            });
          }}
        />
        Communication address same as permanent
      </label>
      {!value.sameAsPermanent
        ? addressBlock(
            'Communication address',
            value.communicationAddress,
            (communicationAddress) => onChange({ ...value, communicationAddress }),
          )
        : null}
    </div>
  );
}

export function BankSection({
  value,
  onChange,
}: {
  value: OnboardingFormState['bank'];
  onChange: (v: OnboardingFormState['bank']) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field(
        'Account holder name',
        value.accountHolderName,
        (accountHolderName) => onChange({ ...value, accountHolderName }),
        { required: true },
      )}
      {field('Bank name', value.bankName, (bankName) => onChange({ ...value, bankName }), {
        required: true,
      })}
      {field(
        'Account number',
        value.accountNumber,
        (accountNumber) => onChange({ ...value, accountNumber }),
        {
          required: true,
        },
      )}
      {field('IFSC code', value.ifscCode, (ifscCode) => onChange({ ...value, ifscCode }), {
        required: true,
      })}
      {field('UPI ID', value.upiId, (upiId) => onChange({ ...value, upiId }))}
      {field('Branch name', value.branchName, (branchName) => onChange({ ...value, branchName }))}
    </div>
  );
}

export const EMERGENCY_RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'child', label: 'Child' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'friend', label: 'Friend' },
  { value: 'relative', label: 'Relative' },
  { value: 'other', label: 'Other' },
] as const;

export function EmergencySection({
  value,
  onChange,
}: {
  value: OnboardingFormState['emergency'];
  onChange: (v: OnboardingFormState['emergency']) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field('Contact name', value.name, (name) => onChange({ ...value, name }), {
        required: true,
      })}
      <SelectField label="Relationship" required>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={value.relationship}
          onChange={(e) => onChange({ ...value, relationship: e.target.value })}
          required
        >
          <option value="">Select…</option>
          {EMERGENCY_RELATIONSHIP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {value.relationship &&
          !EMERGENCY_RELATIONSHIP_OPTIONS.some((option) => option.value === value.relationship) ? (
            <option value={value.relationship}>{value.relationship}</option>
          ) : null}
        </select>
      </SelectField>
      {field('Phone', value.phone, (phone) => onChange({ ...value, phone }), { required: true })}
      {field('Email', value.email, (email) => onChange({ ...value, email }), { type: 'email' })}
    </div>
  );
}

export function DocumentsSection({
  value,
  onChange,
}: {
  value: OnboardingFormState['documents'];
  onChange: (v: OnboardingFormState['documents']) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add your highest qualification. You can upload document scans from your profile after login.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('Institution / college', value.institution, (institution) =>
          onChange({ ...value, institution }),
        )}
        {field('Degree / qualification', value.degree, (degree) => onChange({ ...value, degree }))}
        {field('Field of study', value.fieldOfStudy, (fieldOfStudy) =>
          onChange({ ...value, fieldOfStudy }),
        )}
        {field('Year of passing', value.year, (year) => onChange({ ...value, year }))}
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Additional notes</span>
        <textarea
          className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Any other details for HR"
        />
      </label>
    </div>
  );
}

export function sectionToPayload(
  section: OnboardingSectionId,
  form: OnboardingFormState,
): Record<string, unknown> {
  switch (section) {
    case 'personal':
      return { ...form.personal };
    case 'address':
      return {
        permanentAddress: form.address.permanentAddress,
        communicationAddress: form.address.sameAsPermanent
          ? form.address.permanentAddress
          : form.address.communicationAddress,
      };
    case 'bank':
      return { ...form.bank, isPrimary: true };
    case 'emergency':
      return { ...form.emergency, isPrimary: true };
    case 'documents':
      return { ...form.documents };
    default:
      return {};
  }
}

export function hydrateFormFromApi(formData: Record<string, unknown>): OnboardingFormState {
  const base = emptyOnboardingForm();
  const personal = (formData.personal as Record<string, unknown> | undefined) ?? {};
  const address = (formData.address as Record<string, unknown> | undefined) ?? {};
  const bank =
    (formData.bank as Record<string, unknown> | undefined) ??
    (formData.bank_details as Record<string, unknown> | undefined) ??
    {};
  const emergency =
    (formData.emergency as Record<string, unknown> | undefined) ??
    (formData.emergency_contact as Record<string, unknown> | undefined) ??
    {};
  const documents = (formData.documents as Record<string, unknown> | undefined) ?? {};

  const readAddress = (raw: unknown): AddressFields => {
    const a = (raw as AddressFields | undefined) ?? EMPTY_ADDRESS;
    return { ...EMPTY_ADDRESS, ...a };
  };

  const permanent = readAddress(address.permanentAddress);
  const communication = readAddress(address.communicationAddress);

  return {
    personal: {
      ...base.personal,
      dateOfBirth: String(personal.dateOfBirth ?? '').slice(0, 10),
      gender: String(personal.gender ?? ''),
      bloodGroup: String(personal.bloodGroup ?? ''),
      nationality: String(personal.nationality ?? 'Indian'),
      maritalStatus: String(personal.maritalStatus ?? ''),
      phone: String(personal.phone ?? ''),
      aadhaarNumber: String(personal.aadhaarNumber ?? ''),
      panNumber: String(personal.panNumber ?? ''),
    },
    address: {
      permanentAddress: permanent,
      communicationAddress: communication,
      sameAsPermanent:
        JSON.stringify(permanent) === JSON.stringify(communication) ||
        !address.communicationAddress,
    },
    bank: {
      ...base.bank,
      accountHolderName: String(bank.accountHolderName ?? ''),
      bankName: String(bank.bankName ?? ''),
      accountNumber: String(bank.accountNumber ?? ''),
      ifscCode: String(bank.ifscCode ?? ''),
      upiId: String(bank.upiId ?? ''),
      branchName: String(bank.branchName ?? ''),
    },
    emergency: {
      ...base.emergency,
      name: String(emergency.name ?? ''),
      relationship: String(emergency.relationship ?? ''),
      phone: String(emergency.phone ?? ''),
      email: String(emergency.email ?? ''),
    },
    documents: {
      ...base.documents,
      institution: String(documents.institution ?? ''),
      degree: String(documents.degree ?? ''),
      fieldOfStudy: String(documents.fieldOfStudy ?? ''),
      year: String(documents.year ?? ''),
      notes: String(documents.notes ?? ''),
    },
  };
}

export function validateSection(
  section: OnboardingSectionId,
  form: OnboardingFormState,
): string | null {
  switch (section) {
    case 'personal':
      if (!form.personal.dateOfBirth || !form.personal.gender || !form.personal.phone.trim()) {
        return 'Personal: date of birth, gender, and phone are required.';
      }
      return null;
    case 'address':
      if (
        !form.address.permanentAddress.line1.trim() ||
        !form.address.permanentAddress.city.trim()
      ) {
        return 'Address: permanent address line 1 and city are required.';
      }
      return null;
    case 'bank':
      if (
        !form.bank.accountHolderName.trim() ||
        !form.bank.bankName.trim() ||
        !form.bank.accountNumber.trim() ||
        !form.bank.ifscCode.trim()
      ) {
        return 'Bank: account holder, bank name, account number, and IFSC are required.';
      }
      return null;
    case 'emergency':
      if (
        !form.emergency.name.trim() ||
        !form.emergency.relationship.trim() ||
        !form.emergency.phone.trim()
      ) {
        return 'Emergency: contact name, relationship, and phone are required.';
      }
      return null;
    case 'documents':
      return null;
    default:
      return null;
  }
}
