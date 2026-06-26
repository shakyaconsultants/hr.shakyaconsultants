import { Link } from 'react-router-dom';
import { KeyRound, Shield, GitCompare, FlaskConical } from 'lucide-react';
import { ROUTES } from '@/config/app.config';

const CARDS = [
  {
    title: 'Roles',
    description: 'Create, clone, archive, and manage role permissions',
    icon: Shield,
    to: ROUTES.RBAC_ROLES,
  },
  {
    title: 'Permission Matrix',
    description: 'Browse permissions by module, group, and category',
    icon: KeyRound,
    to: ROUTES.RBAC_MATRIX,
  },
  {
    title: 'Permission Simulator',
    description: 'Preview effective permissions before saving assignments',
    icon: FlaskConical,
    to: ROUTES.RBAC_SIMULATOR,
  },
  {
    title: 'Role Comparison',
    description: 'Compare two roles side by side',
    icon: GitCompare,
    to: ROUTES.RBAC_SIMULATOR,
  },
];

export function RbacDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
        <p className="text-muted-foreground">
          Enterprise RBAC — roles, permissions, assignments, and simulation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="rounded-lg border bg-card p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
          >
            <card.icon className="mb-3 h-6 w-6 text-primary" />
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
