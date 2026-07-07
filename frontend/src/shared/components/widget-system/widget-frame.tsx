import {
  Suspense,
  Component,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import { AlertTriangle } from 'lucide-react';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';

export interface WidgetFrameProps {
  id: string;
  title: string;
  colSpan?: 1 | 2 | 3 | 4;
  visible?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

const colSpanClass: Record<1 | 2 | 3 | 4, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
};

export function WidgetFrame({
  id,
  title,
  colSpan = 1,
  visible = true,
  action,
  children,
}: WidgetFrameProps) {
  if (!visible) {
    return null;
  }

  return (
    <div id={`widget-${id}`} data-widget-id={id} className={`col-span-1 ${colSpanClass[colSpan]}`}>
      <section
        className="flex h-full flex-col rounded-lg border bg-card shadow-sm"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
        <div className="flex-1 p-4">{children}</div>
      </section>
    </div>
  );
}

export interface LazyWidgetProps {
  id: string;
  title: string;
  colSpan?: 1 | 2 | 3 | 4;
  component: LazyExoticComponent<ComponentType<object>>;
}

export function LazyWidget({ id, title, colSpan, component: Component }: LazyWidgetProps) {
  return (
    <WidgetFrame id={id} title={title} colSpan={colSpan}>
      <WidgetErrorBoundary widgetId={id} title={title}>
        <Suspense fallback={<WidgetSkeleton title={title} />}>
          <Component />
        </Suspense>
      </WidgetErrorBoundary>
    </WidgetFrame>
  );
}

interface WidgetErrorBoundaryProps {
  widgetId: string;
  title: string;
  children: ReactNode;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-muted-foreground">
          <AlertTriangle className="h-8 w-8 text-destructive/70" aria-hidden />
          <p>Could not load {this.props.title}.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WidgetGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
