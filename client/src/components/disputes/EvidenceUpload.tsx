/**
 * EvidenceUpload Component
 * 
 * Upload and manage evidence for a dispute
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  X, 
  FileImage, 
  FileText, 
  Film,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedEvidence {
  id: string;
  url: string;
  filename: string;
  type: 'image' | 'document' | 'video';
  uploadedAt: string;
}

interface EvidenceUploadProps {
  disputeId: string;
  existingEvidence: UploadedEvidence[];
  maxFiles?: number;
  onUpload: (file: File) => Promise<{ url: string; filename: string }>;
  onRemove: (evidenceId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/pdf': 'document',
  'video/mp4': 'video',
  'video/webm': 'video',
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileType(mimeType: string): 'image' | 'document' | 'video' {
  return (ACCEPTED_TYPES as any)[mimeType] || 'document';
}

function getFileIcon(type: 'image' | 'document' | 'video') {
  switch (type) {
    case 'image': return FileImage;
    case 'video': return Film;
    default: return FileText;
  }
}

export function EvidenceUpload({
  disputeId,
  existingEvidence,
  maxFiles = 5,
  onUpload,
  onRemove,
  isLoading,
  className,
}: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canUploadMore = existingEvidence.length < maxFiles;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      setError('Invalid file type. Please upload an image, PDF, or video.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
      // Clear the input
      e.target.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleRemove = async (evidenceId: string) => {
    setRemovingId(evidenceId);
    try {
      await onRemove(evidenceId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove evidence');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Evidence
          <Badge variant="outline" className="ml-auto">
            {existingEvidence.length}/{maxFiles}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {canUploadMore && (
          <div className="space-y-2">
            <Label htmlFor="evidence-upload">Upload Evidence</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Input
                id="evidence-upload"
                type="file"
                accept={Object.keys(ACCEPTED_TYPES).join(',')}
                onChange={handleFileChange}
                disabled={uploading || isLoading}
                className="hidden"
              />
              <label 
                htmlFor="evidence-upload" 
                className={cn(
                  'cursor-pointer flex flex-col items-center gap-2',
                  (uploading || isLoading) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Images, PDFs, or videos up to 10MB
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Existing Evidence List */}
        {existingEvidence.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Evidence</Label>
            <div className="space-y-2">
              {existingEvidence.map((evidence) => {
                const Icon = getFileIcon(evidence.type);
                const isRemoving = removingId === evidence.id;

                return (
                  <div 
                    key={evidence.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    {evidence.type === 'image' ? (
                      <img 
                        src={evidence.url} 
                        alt={evidence.filename}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-background rounded flex items-center justify-center">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{evidence.filename}</p>
                      <p className="text-xs text-muted-foreground capitalize">{evidence.type}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={evidence.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(evidence.id)}
                        disabled={isRemoving || isLoading}
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Evidence */}
        {existingEvidence.length === 0 && !canUploadMore && (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No evidence uploaded</p>
          </div>
        )}

        {/* Tips */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Tip:</strong> Upload screenshots, receipts, chat logs, photos, or any documentation 
            that supports your case. Clear evidence helps the AI make fair decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
