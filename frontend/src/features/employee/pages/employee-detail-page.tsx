import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useEmployeeDashboard, useUploadDocument } from '@/features/employee/hooks/use-employees';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';

const TABS = ['Overview', 'Documents', 'Education', 'Experience', 'Skills', 'Timeline', 'Assets', 'Reporting'] as const;

export function EmployeeDetailPage() {
  const { id = '' } = useParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const { data, isLoading, isError } = useEmployeeDashboard(id);
  const uploadMutation = useUploadDocument();

  if (isLoading) {
    return <Loading message="Loading employee profile..." />;
  }

  if (isError || !data) {
    return <p className="text-destructive">Failed to load employee profile.</p>;
  }

  const employee = data.employee;

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await uploadMutation.mutateAsync({ employeeId: id, file, documentType: 'profile_photo' });
  }

  return (
    <div className="space-y-6">
      <Link to={ROUTES.EMPLOYEES} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Employees
      </Link>

      <div className="flex flex-wrap items-start gap-6 rounded-lg border bg-card p-6">
        <div className="relative">
          {employee.photoUrl ? (
            <img src={employee.photoUrl} alt="" className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-2xl font-semibold">
              {employee.firstName.charAt(0)}
              {employee.lastName.charAt(0)}
            </div>
          )}
          <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground shadow">
            <Upload className="h-3.5 w-3.5" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">{employee.employeeNumber}</p>
          <p className="text-sm">{employee.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{employee.employmentStatus}</span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{employee.status}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-b-none"
          >
            {tab}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        {activeTab === 'Overview' && (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-sm text-muted-foreground">Phone</dt><dd>{employee.phone ?? '—'}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Department</dt><dd className="font-mono text-xs">{employee.departmentId}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Designation</dt><dd className="font-mono text-xs">{employee.designationId}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Joined</dt><dd>{new Date(employee.joinedAt).toLocaleDateString()}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Employment Type</dt><dd>{employee.employmentType}</dd></div>
          </dl>
        )}

        {activeTab === 'Documents' && (
          <ul className="space-y-2">
            {data.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            ) : (
              data.documents.map((doc) => (
                <li key={String(doc.id)} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <span>{String(doc.fileName)}</span>
                  <a href={String(doc.fileUrl)} target="_blank" rel="noreferrer" className="text-primary hover:underline">Preview</a>
                </li>
              ))
            )}
          </ul>
        )}

        {activeTab === 'Education' && (
          <ul className="space-y-3">
            {data.education.map((item) => (
              <li key={String(item.id)} className="rounded border p-3 text-sm">
                <p className="font-medium">{String(item.degree)} — {String(item.institution)}</p>
                {item.university ? <p className="text-muted-foreground">{String(item.university)}</p> : null}
              </li>
            ))}
            {data.education.length === 0 && <p className="text-sm text-muted-foreground">No education records.</p>}
          </ul>
        )}

        {activeTab === 'Experience' && (
          <ul className="space-y-3">
            {data.experience.map((item) => (
              <li key={String(item.id)} className="rounded border p-3 text-sm">
                <p className="font-medium">{String(item.title)} at {String(item.company)}</p>
              </li>
            ))}
            {data.experience.length === 0 && <p className="text-sm text-muted-foreground">No experience records.</p>}
          </ul>
        )}

        {activeTab === 'Skills' && (
          <ul className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <li key={String(skill.id)} className="rounded-full bg-muted px-3 py-1 text-sm">
                {String(skill.skillName)} ({String(skill.level)})
              </li>
            ))}
            {data.skills.length === 0 && <p className="text-sm text-muted-foreground">No skills recorded.</p>}
          </ul>
        )}

        {activeTab === 'Timeline' && (
          <ol className="space-y-3 border-l-2 pl-4">
            {data.timeline.map((event) => (
              <li key={String(event.id)} className="relative text-sm">
                <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="font-medium">{String(event.title)}</p>
                <p className="text-xs text-muted-foreground">{new Date(String(event.occurredAt)).toLocaleString()}</p>
              </li>
            ))}
            {data.timeline.length === 0 && <p className="text-sm text-muted-foreground">No timeline events.</p>}
          </ol>
        )}

        {activeTab === 'Assets' && (
          <ul className="space-y-2">
            {data.assets.map((asset) => (
              <li key={String(asset.id)} className="flex justify-between rounded border px-3 py-2 text-sm">
                <span>{String(asset.name)} ({String(asset.assetType)})</span>
                <span className="text-muted-foreground">{String(asset.status)}</span>
              </li>
            ))}
            {data.assets.length === 0 && <p className="text-sm text-muted-foreground">No assets assigned.</p>}
          </ul>
        )}

        {activeTab === 'Reporting' && (
          <ul className="space-y-2">
            {data.managers.map((manager) => (
              <li key={String(manager.id)} className="rounded border px-3 py-2 text-sm">
                Manager: <span className="font-mono">{String(manager.managerId)}</span>
                <span className="ml-2 text-muted-foreground">({String(manager.relationshipType)})</span>
              </li>
            ))}
            {data.managers.length === 0 && <p className="text-sm text-muted-foreground">No manager relationships.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}
