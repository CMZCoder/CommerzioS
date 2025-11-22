import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCw, RotateCcw } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageMetadata {
  crop?: Area;  // Percentages
  cropPixels?: Area;  // Pixel coordinates
  rotation: number;
  zoom?: number;
}

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (metadata: ImageMetadata) => void;
  initialMetadata?: ImageMetadata;
}

export function ImageEditor({ 
  open, 
  onOpenChange, 
  imageUrl, 
  onSave,
  initialMetadata 
}: ImageEditorProps) {
  // Keep crop position centered at origin (react-easy-crop uses 0-centered coords)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area>({ x: 0, y: 0, width: 100, height: 100 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>({ x: 0, y: 0, width: 0, height: 0 });

  // Sync all state with initialMetadata when dialog opens
  useEffect(() => {
    if (open) {
      if (initialMetadata) {
        // Restore all saved metadata
        setZoom(initialMetadata.zoom || 1);
        setRotation(initialMetadata.rotation || 0);
        setCrop({ x: 0, y: 0 }); // Keep at origin - initialCroppedAreaPixels handles framing
        
        // Hydrate cropped area state from saved metadata
        if (initialMetadata.crop) {
          setCroppedArea(initialMetadata.crop);
        } else {
          // Default to full frame if no crop data
          setCroppedArea({ x: 0, y: 0, width: 100, height: 100 });
        }
        
        if (initialMetadata.cropPixels) {
          setCroppedAreaPixels(initialMetadata.cropPixels);
        } else {
          // Set to zero dimensions - will be updated by onCropComplete
          setCroppedAreaPixels({ x: 0, y: 0, width: 0, height: 0 });
        }
      } else {
        // Reset to defaults for new images
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppedArea({ x: 0, y: 0, width: 100, height: 100 });
        setCroppedAreaPixels({ x: 0, y: 0, width: 0, height: 0 });
      }
    }
  }, [open, initialMetadata]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedArea);
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number }) => {
    // If we don't have valid cropPixels yet (new image), compute full-frame crop
    if (croppedAreaPixels.width === 0 || croppedAreaPixels.height === 0) {
      // Calculate full-frame crop for 4:3 aspect ratio
      const aspectRatio = 4 / 3;
      let cropWidth = mediaSize.width;
      let cropHeight = mediaSize.width / aspectRatio;
      
      if (cropHeight > mediaSize.height) {
        cropHeight = mediaSize.height;
        cropWidth = mediaSize.height * aspectRatio;
      }
      
      const cropX = (mediaSize.width - cropWidth) / 2;
      const cropY = (mediaSize.height - cropHeight) / 2;
      
      // Set valid full-frame crop
      const fullFrameCropPixels: Area = {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      };
      
      const fullFrameCrop: Area = {
        x: (cropX / mediaSize.width) * 100,
        y: (cropY / mediaSize.height) * 100,
        width: (cropWidth / mediaSize.width) * 100,
        height: (cropHeight / mediaSize.height) * 100,
      };
      
      setCroppedAreaPixels(fullFrameCropPixels);
      setCroppedArea(fullFrameCrop);
    }
  }, [croppedAreaPixels]);

  const handleSave = () => {
    onSave({
      crop: croppedArea,
      cropPixels: croppedAreaPixels,
      rotation,
      zoom,
    });
    onOpenChange(false);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cropper */}
          <div className="relative h-96 bg-slate-900 rounded-lg overflow-hidden">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={4 / 3}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onMediaLoaded={onMediaLoaded}
              initialCroppedAreaPixels={initialMetadata?.cropPixels}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Rotation Buttons */}
            <div className="flex items-center gap-4">
              <Label className="w-24">Rotation</Label>
              <div className="flex gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotateLeft}
                  data-testid="button-rotate-left"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Rotate Left
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotateRight}
                  data-testid="button-rotate-right"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Rotate Right
                </Button>
                <span className="text-sm text-muted-foreground ml-auto">{rotation}°</span>
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-4">
              <Label className="w-24">Zoom</Label>
              <Slider
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
                data-testid="slider-zoom"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">{zoom.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-edit">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
