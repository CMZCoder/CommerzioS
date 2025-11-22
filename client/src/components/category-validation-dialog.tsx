import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lightbulb, Clock } from "lucide-react";

interface CategoryValidationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalName: string;
  aiSuggestedName?: string;
  aiReasoning: string;
  onUseSuggested: () => void;
  onSubmitForReview: () => void;
  isProcessing: boolean;
}

export function CategoryValidationDialog({
  open,
  onOpenChange,
  originalName,
  aiSuggestedName,
  aiReasoning,
  onUseSuggested,
  onSubmitForReview,
  isProcessing,
}: CategoryValidationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Category Suggestion Validation
          </DialogTitle>
          <DialogDescription>
            Our AI assistant has reviewed your category suggestion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Category Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Your Suggested Name:</label>
            <div className="px-3 py-2 bg-slate-100 rounded-md border border-slate-200">
              <p className="font-medium text-slate-900" data-testid="text-original-category-name">
                {originalName}
              </p>
            </div>
          </div>

          {/* AI Reasoning */}
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900" data-testid="text-ai-reasoning">
              <span className="font-semibold">AI Analysis:</span> {aiReasoning}
            </AlertDescription>
          </Alert>

          {/* AI Suggested Alternative */}
          {aiSuggestedName && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Suggested Alternative:
              </label>
              <div className="px-3 py-2 bg-primary/5 rounded-md border border-primary/20">
                <p className="font-medium text-primary" data-testid="text-suggested-category-name">
                  {aiSuggestedName}
                </p>
              </div>
            </div>
          )}

          {/* Temporary Category Notice */}
          {aiSuggestedName && (
            <Alert variant="default" className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                Using the suggested name will create a <strong>temporary category</strong> that expires in 24 hours. 
                This allows you to use it immediately while our team reviews it for permanent addition.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            data-testid="button-cancel-validation"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onSubmitForReview}
            disabled={isProcessing}
            data-testid="button-submit-for-review"
          >
            {isProcessing ? "Submitting..." : "Submit for Review"}
          </Button>
          {aiSuggestedName && (
            <Button
              type="button"
              onClick={onUseSuggested}
              disabled={isProcessing}
              data-testid="button-use-suggested-name"
            >
              {isProcessing ? "Creating..." : "Use Suggested Name"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
