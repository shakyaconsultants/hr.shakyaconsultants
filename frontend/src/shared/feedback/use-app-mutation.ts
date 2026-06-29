import {
  useMutation,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { parseMutationError } from '@/shared/feedback/mutation-error.util';
import { toastError, toastSuccess } from '@/shared/feedback/toast.store';

export interface AppMutationOptions<TData, TVariables> {
  /** Toast on success. Set false to suppress. */
  successMessage?: string | false | ((data: TData, variables: TVariables) => string);
  /** Toast on error. Default true. Set false when handling inline in forms. */
  errorToast?: boolean;
  /** Extra query keys to invalidate after success. */
  invalidateKeys?: QueryKey[];
}

export function useAppMutation<TData = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, unknown, TVariables, TContext> &
    AppMutationOptions<TData, TVariables>,
): UseMutationResult<TData, unknown, TVariables, TContext> {
  const queryClient = useQueryClient();
  const {
    successMessage,
    errorToast = true,
    invalidateKeys,
    onSuccess,
    onError,
    onSettled,
    ...rest
  } = options;

  return useMutation<TData, unknown, TVariables, TContext>({
    ...rest,
    onSuccess: (data, variables, context, mutation) => {
      if (invalidateKeys?.length) {
        for (const key of invalidateKeys) {
          void queryClient.invalidateQueries({ queryKey: key });
        }
      }

      if (successMessage !== false && successMessage !== undefined) {
        const message =
          typeof successMessage === 'function' ? successMessage(data, variables) : successMessage;
        toastSuccess(message);
      }

      onSuccess?.(data, variables, context, mutation);
    },
    onError: (error, variables, context, mutation) => {
      if (errorToast) {
        const parsed = parseMutationError(error);
        toastError(parsed.title, parsed.description);
      }
      onError?.(error, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      onSettled?.(data, error, variables, context, mutation);
    },
  });
}
