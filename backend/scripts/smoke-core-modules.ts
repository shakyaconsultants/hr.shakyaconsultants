/**
 * Smoke test for core HR modules: department, designation, employee, leave.
 * Usage: npx tsx scripts/smoke-core-modules.ts
 */
import '../src/bootstrap-env.js';

const BASE = `http://127.0.0.1:${process.env.PORT ?? '4000'}/api/v1`;
const EMAIL = (process.env.SEED_ADMIN_EMAIL ?? process.env.SUPER_ADMIN_EMAIL ?? '').trim();
const PASSWORD = (process.env.SEED_ADMIN_PASSWORD ?? process.env.SUPER_ADMIN_PASSWORD ?? '').trim();
const COMPANY_CODE = (process.env.SEED_COMPANY_CODE ?? 'HRS').trim().toUpperCase();

interface ApiEnvelope<T = unknown> {
  success: boolean;
  statusCode?: number;
  data?: T;
  error?: { message?: string; code?: string };
}

const results: Array<{ name: string; ok: boolean; detail?: string }> = [];

function record(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function request<T>(
  method: string,
  path: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; json: ApiEnvelope<T> }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: ApiEnvelope<T> = { success: false };
  try {
    json = (await response.json()) as ApiEnvelope<T>;
  } catch {
    json = { success: false, error: { message: `Non-JSON response (${response.status})` } };
  }

  return { status: response.status, json };
}

async function main(): Promise<void> {
  if (!EMAIL || !PASSWORD) {
    console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env');
    process.exit(1);
  }

  console.log(`\nSmoke test → ${BASE}\n`);

  const health = await fetch(`http://127.0.0.1:${process.env.PORT ?? '4000'}/health`);
  if (!health.ok) {
    console.error('Backend is not running. Start it with: npm run dev');
    process.exit(1);
  }
  record('health', true);

  const login = await request<{ tokens: { accessToken: string } }>('POST', '/auth/login', undefined, {
    companyCode: COMPANY_CODE,
    email: EMAIL,
    password: PASSWORD,
    rememberMe: false,
  });
  const token =
    login.json.data?.tokens?.accessToken ??
    (login.json.data && 'accessToken' in login.json.data
      ? String((login.json.data as { accessToken: string }).accessToken)
      : '');
  record('auth login', login.status === 200 && Boolean(token), login.json.error?.message ?? JSON.stringify((login.json as { error?: { details?: unknown } }).error?.details));
  if (!token) {
    printSummary();
    process.exit(1);
  }

  const suffix = Date.now().toString(36);

  const deptCreate = await request<Record<string, unknown>>('POST', '/organization/entities/department', token, {
    data: { name: `Smoke Dept ${suffix}`, description: 'Automated smoke test department' },
  });
  const deptId = typeof deptCreate.json.data?.id === 'string' ? deptCreate.json.data.id : '';
  record('department create', deptCreate.status === 201 && Boolean(deptId), deptCreate.json.error?.message);

  const deptList = await request<unknown>('GET', '/organization/entities/department?pageSize=5', token);
  record('department list', deptList.status === 200, deptList.json.error?.message);

  if (deptId) {
    const deptDetail = await request('GET', `/organization/departments/${deptId}/detail`, token);
    record('department detail', deptDetail.status === 200, deptDetail.json.error?.message);
  }

  const desigCreate = await request<Record<string, unknown>>('POST', '/organization/entities/designation', token, {
    data: {
      name: `Smoke Designation ${suffix}`,
      departmentIds: deptId ? [deptId] : [],
      hierarchyLevel: 3,
    },
  });
  const desigId = typeof desigCreate.json.data?.id === 'string' ? desigCreate.json.data.id : '';
  record('designation create', desigCreate.status === 201 && Boolean(desigId), desigCreate.json.error?.message);

  const desigList = await request('GET', '/organization/entities/designation?pageSize=5', token);
  record('designation list', desigList.status === 200, desigList.json.error?.message);

  if (desigId) {
    const desigDetail = await request('GET', `/organization/designations/${desigId}/detail`, token);
    record('designation detail', desigDetail.status === 200, desigDetail.json.error?.message);
  }

  if (!deptId || !desigId) {
    printSummary();
    process.exit(1);
  }

  const empEmail = `smoke.employee.${suffix}@example.com`;
  const empCreate = await request<Record<string, unknown>>('POST', '/employees', token, {
    firstName: 'Smoke',
    lastName: `Test${suffix}`,
    email: empEmail,
    departmentId: deptId,
    designationId: desigId,
    joinedAt: new Date().toISOString(),
  });
  const empId = typeof empCreate.json.data?.id === 'string' ? empCreate.json.data.id : '';
  record('employee create', empCreate.status === 201 && Boolean(empId), empCreate.json.error?.message);

  const empList = await request('GET', '/employees?pageSize=5', token);
  record('employee list', empList.status === 200, empList.json.error?.message);

  if (empId) {
    const empGet = await request('GET', `/employees/${empId}`, token);
    record('employee get', empGet.status === 200, empGet.json.error?.message);

    const empDash = await request('GET', `/employees/${empId}/dashboard`, token);
    record('employee dashboard', empDash.status === 200, empDash.json.error?.message);
  }

  const seedLeave = await request('POST', '/leave-exit/seed-defaults', token);
  record('leave seed defaults', seedLeave.status === 200, seedLeave.json.error?.message);

  const policies = await request<unknown[]>('GET', '/leave-exit/policies', token);
  const policyCount = Array.isArray(policies.json.data) ? policies.json.data.length : 0;
  record('leave policies list', policies.status === 200 && policyCount > 0, `count=${policyCount}`);

  const firstPolicy =
    Array.isArray(policies.json.data) && policies.json.data[0] && typeof policies.json.data[0] === 'object'
      ? (policies.json.data[0] as { id?: string }).id
      : undefined;

  if (empId && firstPolicy) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const end = new Date(tomorrow);
    end.setDate(end.getDate() + 1);

    const leaveApply = await request('POST', '/leave-exit/leave-requests', token, {
      employeeId: empId,
      leavePolicyId: firstPolicy,
      startDate: tomorrow.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      durationType: 'full_day',
      reason: 'Smoke test leave request',
      isEmergency: true,
      submit: true,
    });
    record('leave apply', leaveApply.status === 200, leaveApply.json.error?.message);

    const leaveList = await request('GET', `/leave-exit/leave-requests?employeeId=${empId}`, token);
    record('leave requests list', leaveList.status === 200, leaveList.json.error?.message);

    const balances = await request('GET', `/leave-exit/balances?employeeId=${empId}`, token);
    record('leave balances', balances.status === 200, balances.json.error?.message);
  } else {
    record('leave apply', false, 'missing employee or policy');
    record('leave requests list', false, 'skipped');
    record('leave balances', false, 'skipped');
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed > 0 ? 1 : 0);
}

function printSummary(): void {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n--- ${passed}/${results.length} passed, ${failed} failed ---\n`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
