import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { toastError, toastSuccess } from '@/shared/feedback/toast.store';

export interface RunFormMutationOptions<T> {
  mutation: () => Promise<T>;
  successMessage: string;
  setError?: (message: string | null) => void;
  onSuccess?: (result: T) => void;
  /** Called before showing a toast for non-inline errors (e.g. close modal so toast is visible). */
  onNonInlineError?: () => void;
  /** When true, validation errors go inline; other errors still toast. Default true. */
  inlineValidation?: boolean;
}

/** Execute a form mutation with loading-safe UX: inline validation + success toast. */
export async function runFormMutation<T>({
  mutation,
  successMessage,
  setError,
  onSuccess,
  onNonInlineError,
  inlineValidation = true,
}: RunFormMutationOptions<T>): Promise<boolean> {
  setError?.(null);

  try {
    const result = await mutation();
    toastSuccess(successMessage);
    onSuccess?.(result);
    return true;
  } catch (error) {
    const parsed = parseMutationError(error);

    if (inlineValidation && parsed.preferInline && setError) {
      setError(parsed.validationMessages.join(' ') || parsed.message);
      return false;
    }

    onNonInlineError?.();
    toastError(parsed.title, parsed.description);
    return false;
  }
}

export interface RunDeleteMutationOptions {
  mutation: () => Promise<unknown>;
  successMessage: string;
  setError?: (message: string | null) => void;
  onSuccess?: () => void;
  entityLabel?: string;
}

export interface RunActionMutationOptions<T> {
  mutation: () => Promise<T>;
  successMessage: string;
  onSuccess?: (result: T) => void;
}

/** Execute a one-shot action (restore, approve, assign) with toast feedback. */
export async function runActionMutation<T>({
  mutation,
  successMessage,
  onSuccess,
}: RunActionMutationOptions<T>): Promise<boolean> {
  try {
    const result = await mutation();
    toastSuccess(successMessage);
    onSuccess?.(result);
    return true;
  } catch (error) {
    const parsed = parseMutationError(error);
    toastError(parsed.title, parsed.description);
    return false;
  }
}

/** Execute delete/archive with conflict-aware messaging for modals. */
export async function runDeleteMutation({
  mutation,
  successMessage,
  setError,
  onSuccess,
  entityLabel,
}: RunDeleteMutationOptions): Promise<boolean> {
  setError?.(null);

  try {
    await mutation();
    toastSuccess(successMessage);
    onSuccess?.();
    return true;
  } catch (error) {
    const parsed = parseMutationError(error);
    const message =
      parsed.isConflict && parsed.dependencies.length > 0
        ? [
            entityLabel ? `Cannot delete ${entityLabel}.` : parsed.title,
            ...parsed.dependencies.map((dep) => `${dep.count} ${dep.label}`),
            'Move or archive them first.',
          ].join('\n')
        : parsed.message;

    setError?.(message);
    if (!parsed.isConflict || parsed.dependencies.length === 0) {
      toastError(parsed.title, parsed.description);
    }
    return false;
  }
}
