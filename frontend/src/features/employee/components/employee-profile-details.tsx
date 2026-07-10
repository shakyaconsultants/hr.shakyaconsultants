type AddressLike = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

function formatAddress(address: AddressLike | null | undefined): string {
  if (!address?.line1) {
    return '—';
  }
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  return parts.join(', ');
}

function formatDate(value: unknown): string {
  if (!value) {
    return '—';
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function formatLabel(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  return String(value);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

export interface EmployeeProfileDetailsProps {
  employee: Record<string, unknown>;
  emergencyContacts?: Record<string, unknown>[];
  bankDetails?: Record<string, unknown>[];
}

export function EmployeeProfileDetails({
  employee,
  emergencyContacts = [],
  bankDetails = [],
}: EmployeeProfileDetailsProps) {
  const permanentAddress = employee.permanentAddress as AddressLike | undefined;
  const communicationAddress = employee.communicationAddress as AddressLike | undefined;
  const primaryContact =
    emergencyContacts.find((item) => item.isPrimary === true) ?? emergencyContacts[0];
  const primaryBank = bankDetails.find((item) => item.isPrimary === true) ?? bankDetails[0];

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 font-semibold">Personal details</h3>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Date of birth" value={formatDate(employee.dateOfBirth)} />
          <DetailItem label="Gender" value={formatLabel(employee.gender)} />
          <DetailItem label="Phone" value={formatLabel(employee.phone)} />
          <DetailItem label="Blood group" value={formatLabel(employee.bloodGroup)} />
          <DetailItem label="Nationality" value={formatLabel(employee.nationality)} />
          <DetailItem label="Marital status" value={formatLabel(employee.maritalStatus)} />
          <DetailItem label="Aadhaar" value={formatLabel(employee.aadhaarNumber)} />
          <DetailItem label="PAN" value={formatLabel(employee.panNumber)} />
        </dl>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Addresses</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Permanent address" value={formatAddress(permanentAddress)} />
          <DetailItem label="Communication address" value={formatAddress(communicationAddress)} />
        </dl>
      </section>

      {primaryBank ? (
        <section>
          <h3 className="mb-3 font-semibold">Bank details</h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Account holder" value={formatLabel(primaryBank.accountHolderName)} />
            <DetailItem label="Bank" value={formatLabel(primaryBank.bankName)} />
            <DetailItem label="Account number" value={formatLabel(primaryBank.accountNumber)} />
            <DetailItem label="IFSC" value={formatLabel(primaryBank.ifscCode)} />
            <DetailItem label="UPI ID" value={formatLabel(primaryBank.upiId)} />
            <DetailItem label="Branch" value={formatLabel(primaryBank.branchName)} />
          </dl>
        </section>
      ) : null}

      {primaryContact ? (
        <section>
          <h3 className="mb-3 font-semibold">Emergency contact</h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Name" value={formatLabel(primaryContact.name)} />
            <DetailItem label="Relationship" value={formatLabel(primaryContact.relationship)} />
            <DetailItem label="Phone" value={formatLabel(primaryContact.phone)} />
            <DetailItem label="Email" value={formatLabel(primaryContact.email)} />
          </dl>
        </section>
      ) : null}
    </div>
  );
}
