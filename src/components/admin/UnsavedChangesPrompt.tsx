import ConfirmDialog from './ConfirmDialog';
import { adminTr } from '../../lib/adminTr';

interface UnsavedChangesPromptProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UnsavedChangesPrompt({ open, onConfirm, onCancel }: UnsavedChangesPromptProps) {
  return (
    <ConfirmDialog
      open={open}
      message={adminTr.confirmUnsavedLeave}
      confirmLabel={adminTr.yes}
      cancelLabel={adminTr.cancel}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
