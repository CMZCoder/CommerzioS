import { ServiceFormModal } from "./service-form-modal";

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuggestCategory: () => void;
  onCategoryCreated?: (categoryId: string) => void;
  preselectedCategoryId?: string | null;
}

export function CreateServiceModal({ open, onOpenChange, onSuggestCategory, onCategoryCreated, preselectedCategoryId }: CreateServiceModalProps) {
  return (
    <ServiceFormModal
      open={open}
      onOpenChange={onOpenChange}
      onSuggestCategory={onSuggestCategory}
      onCategoryCreated={onCategoryCreated}
      preselectedCategoryId={preselectedCategoryId}
    />
  );
}
