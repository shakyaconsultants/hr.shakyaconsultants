export function renderOfferLetterHtml(data: {
  candidateName: string;
  jobTitle: string;
  department: string;
  salary: number;
  currency: string;
  joiningDate: string;
  expiryDate: string;
  salaryBreakdown: Record<string, unknown>;
  companyName: string;
}): string {
  const breakdownRows = Object.entries(data.salaryBreakdown)
    .map(([key, value]) => `<tr><td style="padding:8px;border:1px solid #ddd;">${key}</td><td style="padding:8px;border:1px solid #ddd;">${String(value)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Offer Letter</title></head>
<body style="font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:40px;color:#222;">
<h1 style="text-align:center;border-bottom:2px solid #333;padding-bottom:10px;">Offer of Employment</h1>
<p>${data.companyName}</p>
<p>Date: ${new Date().toLocaleDateString()}</p>
<p>Dear <strong>${data.candidateName}</strong>,</p>
<p>We are pleased to offer you the position of <strong>${data.jobTitle}</strong> in the <strong>${data.department}</strong> department.</p>
<h3>Compensation</h3>
<p>Annual CTC: <strong>${data.currency} ${data.salary.toLocaleString()}</strong></p>
${breakdownRows ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr><th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Component</th><th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Amount</th></tr></thead><tbody>${breakdownRows}</tbody></table>` : ''}
<h3>Joining Details</h3>
<p>Proposed Joining Date: <strong>${data.joiningDate}</strong></p>
<p>This offer is valid until <strong>${data.expiryDate}</strong>.</p>
<p>We look forward to welcoming you to our team.</p>
<p>Sincerely,<br/>Human Resources<br/>${data.companyName}</p>
</body></html>`;
}
