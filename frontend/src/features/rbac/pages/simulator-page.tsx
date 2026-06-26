import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, GitCompare } from 'lucide-react';
import { useCompareRoles, useRoles, useSimulator } from '@/features/rbac/hooks/use-rbac';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

export function SimulatorPage() {
  const { data: rolesData, isLoading: rolesLoading } = useRoles({ pageSize: 100, includeArchived: 0 });
  const simulator = useSimulator();
  const compare = useCompareRoles();

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [extraCodes, setExtraCodes] = useState('');
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const roleOptions = rolesData?.items ?? [];

  const permissionCodes = useMemo(
    () =>
      extraCodes
        .split(/[\n,]+/)
        .map((code) => code.trim())
        .filter(Boolean),
    [extraCodes],
  );

  function toggleRole(roleId: string) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  }

  async function runSimulation() {
    await simulator.mutateAsync({
      roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      permissionCodes: permissionCodes.length > 0 ? permissionCodes : undefined,
    });
  }

  async function runComparison() {
    if (!compareA || !compareB) {
      return;
    }
    await compare.mutateAsync({ roleIdA: compareA, roleIdB: compareB });
  }

  if (rolesLoading) {
    return <Loading message="Loading roles..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link to={ROUTES.RBAC} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Access Control
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Permission Simulator</h1>
        <p className="text-sm text-muted-foreground">
          Preview effective permissions before assigning roles to users.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold">Simulation Input</h2>

          <div>
            <p className="mb-2 text-sm font-medium">Roles</p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded border p-2">
              {roleOptions.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="h-4 w-4 rounded border"
                  />
                  <span className="text-sm">{role.name}</span>
                  <span className="text-xs text-muted-foreground">({role.slug})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Additional permission codes (optional)</p>
            <textarea
              value={extraCodes}
              onChange={(event) => setExtraCodes(event.target.value)}
              placeholder="rbac.role.read&#10;organization.company.read"
              className="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <Button onClick={runSimulation} disabled={simulator.isPending}>
            <Play className="mr-2 h-4 w-4" />
            {simulator.isPending ? 'Running...' : 'Run Simulation'}
          </Button>

          {simulator.data && (
            <div className="space-y-3 rounded-md bg-muted/30 p-4 text-sm">
              {simulator.data.isSuperAdmin && (
                <p className="font-medium text-primary">Super Admin — all permissions granted.</p>
              )}
              <div>
                <p className="font-medium">Effective permissions ({simulator.data.effectivePermissions.length})</p>
                <ul className="mt-1 max-h-40 overflow-y-auto font-mono text-xs">
                  {simulator.data.effectivePermissions.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </div>
              {simulator.data.missingDependencies.length > 0 && (
                <div>
                  <p className="font-medium text-destructive">Missing dependencies</p>
                  <ul className="mt-1 font-mono text-xs">
                    {simulator.data.missingDependencies.map((code) => (
                      <li key={code}>{code}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-lg border p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <GitCompare className="h-4 w-4" />
            Role Comparison
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Role A</label>
              <select
                value={compareA}
                onChange={(event) => setCompareA(event.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select role</option>
                {roleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Role B</label>
              <select
                value={compareB}
                onChange={(event) => setCompareB(event.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select role</option>
                {roleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button variant="outline" onClick={runComparison} disabled={compare.isPending || !compareA || !compareB}>
            {compare.isPending ? 'Comparing...' : 'Compare Roles'}
          </Button>

          {compare.data && (
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="font-medium">Only in A ({compare.data.onlyInA.length})</p>
                <ul className="mt-1 max-h-32 overflow-y-auto font-mono text-xs">
                  {compare.data.onlyInA.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Shared ({compare.data.shared.length})</p>
                <ul className="mt-1 max-h-32 overflow-y-auto font-mono text-xs">
                  {compare.data.shared.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Only in B ({compare.data.onlyInB.length})</p>
                <ul className="mt-1 max-h-32 overflow-y-auto font-mono text-xs">
                  {compare.data.onlyInB.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
