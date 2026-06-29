/**
 * Re-exports mutation hooks with consistent error/success feedback.
 * All feature hooks should import useAppMutation from here or @/shared/feedback/use-app-mutation.
 */
export { useAppMutation } from '@/shared/feedback/use-app-mutation';
export {
  runActionMutation,
  runDeleteMutation,
  runFormMutation,
} from '@/shared/feedback/run-form-mutation';
export { parseMutationError, formatConflictDialogBody } from '@/shared/feedback/mutation-error.util';
export { toastSuccess, toastError, toastInfo } from '@/shared/feedback/toast.store';
