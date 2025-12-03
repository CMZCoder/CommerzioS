import { useEffect, useState, useMemo } from "react";
import { getImageUrl } from "@/lib/config";

interface ImageMetadata {
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cropPixels?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation?: number;
  zoom?: number;
}

/**
 * Hook to generate a cropped/rotated/zoomed thumbnail from an image URL and metadata.
 * Returns a data URL of the processed image suitable for display in cards and previews.
 * Memoized to avoid regenerating on every render.
 */
export function useCroppedImage(imageUrl: string | undefined, metadata: ImageMetadata | undefined): string | undefined {
  const [croppedUrl, setCroppedUrl] = useState<string | undefined>(undefined);

  // Convert /objects/ paths to CDN URLs
  const resolvedImageUrl = useMemo(() => getImageUrl(imageUrl), [imageUrl]);

  // Memoize metadata for stable reference
  const stableMetadata = useMemo(
    () => metadata ? JSON.stringify(metadata) : null,
    [metadata]
  );

  useEffect(() => {
    if (!resolvedImageUrl) {
      setCroppedUrl(undefined);
      return;
    }

    // If no cropPixels or zero-sized crop, use original image (images not yet edited or saved without interaction)
    if (!metadata || !metadata.cropPixels || metadata.cropPixels.width === 0 || metadata.cropPixels.height === 0) {
      setCroppedUrl(resolvedImageUrl);
      return;
    }

    const { cropPixels, rotation = 0, zoom = 1 } = metadata;

    // Load the image
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        // Step 1: Calculate safe area large enough to hold rotated image
        const safeArea = Math.max(img.width, img.height) * 2;
        
        // Step 2: Create safe-area canvas for rotation transformation
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = safeArea;
        tempCanvas.height = safeArea;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (!tempCtx) {
          setCroppedUrl(resolvedImageUrl);
          return;
        }

        // Step 3: Translate to center
        tempCtx.translate(safeArea / 2, safeArea / 2);
        
        // Step 4: Apply rotation
        if (rotation) {
          tempCtx.rotate((rotation * Math.PI) / 180);
        }
        
        // Step 5: Draw full image centered (at original size - no zoom)
        tempCtx.drawImage(
          img,
          -img.width / 2,
          -img.height / 2,
          img.width,
          img.height
        );

        // Step 6: Extract the cropPixels rectangle from the rotated canvas
        // cropPixels are in the original image's pixel space
        // Calculate where the original image sits in the safe area
        const offsetX = (safeArea - img.width) / 2;
        const offsetY = (safeArea - img.height) / 2;
        
        // Extract using raw cropPixels coordinates (no zoom scaling)
        const cropX = offsetX + cropPixels.x;
        const cropY = offsetY + cropPixels.y;
        const cropWidth = cropPixels.width;
        const cropHeight = cropPixels.height;

        // Create final canvas with crop dimensions
        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          setCroppedUrl(resolvedImageUrl);
          return;
        }

        // Extract the crop area from the transformed canvas
        ctx.drawImage(
          tempCanvas,
          cropX,      // Source x in safe area canvas
          cropY,      // Source y in safe area canvas
          cropWidth,  // Source width
          cropHeight, // Source height
          0,          // Dest x
          0,          // Dest y
          cropWidth,  // Dest width
          cropHeight  // Dest height
        );

        // Step 7: Scale down if needed (max 800px)
        const maxDimension = 800;
        if (cropWidth > maxDimension || cropHeight > maxDimension) {
          const scale = Math.min(maxDimension / cropWidth, maxDimension / cropHeight);
          const scaledWidth = cropWidth * scale;
          const scaledHeight = cropHeight * scale;
          
          const scaledCanvas = document.createElement("canvas");
          scaledCanvas.width = scaledWidth;
          scaledCanvas.height = scaledHeight;
          const scaledCtx = scaledCanvas.getContext("2d");
          
          if (scaledCtx) {
            scaledCtx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
            const dataUrl = scaledCanvas.toDataURL("image/jpeg", 0.9);
            setCroppedUrl(dataUrl);
            return;
          }
        }

        // Export data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCroppedUrl(dataUrl);
      } catch (error) {
        console.error("Error generating cropped image:", error);
        setCroppedUrl(resolvedImageUrl);
      }
    };

    img.onerror = () => {
      console.error("Error loading image for cropping");
      setCroppedUrl(resolvedImageUrl);
    };

    img.src = resolvedImageUrl;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [resolvedImageUrl, stableMetadata]);

  return croppedUrl;
}
