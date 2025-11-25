import { ServiceFormModal } from "./service-form-modal";

interface CreateServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuggestCategory: () => void;
  onCategoryCreated?: (categoryId: string) => void;
}

export function CreateServiceModal({ open, onOpenChange, onSuggestCategory, onCategoryCreated }: CreateServiceModalProps) {
  return (
    <ServiceFormModal
      open={open}
      onOpenChange={onOpenChange}
      onSuggestCategory={onSuggestCategory}
      onCategoryCreated={onCategoryCreated}
    />
  );
}
