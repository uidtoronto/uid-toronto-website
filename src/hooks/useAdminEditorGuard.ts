import { useCallback } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { useUnsavedChanges } from './useUnsavedChanges';
import { adminTr } from '../lib/adminTr';

/** Unsaved-changes guard for admin CMS forms (route blocker + cancel confirm). */
export function useAdminEditorGuard(
  isEditing: boolean,
  isDirty: boolean,
  onDiscard: () => void,
) {
  const { confirm } = useConfirm();
  const { showUnsavedDialog, confirmLeave, cancelLeave } = useUnsavedChanges(
    isEditing && isDirty,
    { onLeave: onDiscard },
  );

  const requestCancel = useCallback(async () => {
    if (isDirty) {
      const ok = await confirm(adminTr.confirmUnsavedLeave);
      if (!ok) return;
    }
    onDiscard();
  }, [confirm, isDirty, onDiscard]);

  return { showUnsavedDialog, confirmLeave, cancelLeave, requestCancel };
}
