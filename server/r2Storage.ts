/**
 * Cloudflare R2 Object Storage Service
 * 
 * This module provides S3-compatible storage operations using Cloudflare R2.
 * R2 is accessed via the AWS S3 SDK since it's S3-compatible.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";

// R2 Configuration from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "commerzios-uploads";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://cdn.commerzio.online`;

// Validate required environment variables
function validateR2Config(): void {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn(
      "⚠️ R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
    );
  }
}

// Initialize S3 client for R2
function createR2Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// Lazy-initialized client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = createR2Client();
  }
  if (!r2Client) {
    throw new Error(
      "R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
    );
  }
  return r2Client;
}

// ACL Policy types (simplified from original)
export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * R2 Object Storage Service
 * Provides upload, download, and management of files in Cloudflare R2
 */
export class ObjectStorageService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    this.client = getR2Client();
    this.bucketName = R2_BUCKET_NAME;
    this.publicUrl = R2_PUBLIC_URL;
  }

  /**
   * Generate a presigned URL for uploading a file
   * Returns the upload URL and the object path that will be used
   */
  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const objectKey = `uploads/${objectId}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(this.client, command, {
      expiresIn: 900, // 15 minutes
    });

    return signedUrl;
  }

  /**
   * Generate a presigned URL for uploading with a specific content type
   */
  async getUploadURLWithContentType(contentType: string): Promise<{ uploadURL: string; objectPath: string }> {
    const objectId = randomUUID();
    const objectKey = `uploads/${objectId}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadURL = await getSignedUrl(this.client, command, {
      expiresIn: 900,
    });

    return {
      uploadURL,
      objectPath: `/objects/${objectKey}`,
    };
  }

  /**
   * Get the object key from an object path
   * Converts /objects/uploads/uuid to uploads/uuid
   */
  getObjectKeyFromPath(objectPath: string): string {
    if (objectPath.startsWith("/objects/")) {
      return objectPath.slice(9); // Remove "/objects/"
    }
    if (objectPath.startsWith("/")) {
      return objectPath.slice(1);
    }
    return objectPath;
  }

  /**
   * Check if an object exists
   */
  async objectExists(objectPath: string): Promise<boolean> {
    const objectKey = this.getObjectKeyFromPath(objectPath);

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get object metadata (for compatibility with original interface)
   * Returns an object with key and metadata
   */
  async getObjectEntityFile(objectPath: string): Promise<{ key: string; bucket: string }> {
    const objectKey = this.getObjectKeyFromPath(objectPath);

    const exists = await this.objectExists(objectPath);
    if (!exists) {
      throw new ObjectNotFoundError();
    }

    return {
      key: objectKey,
      bucket: this.bucketName,
    };
  }

  /**
   * Download an object and stream it to the response
   */
  async downloadObject(
    objectFile: { key: string; bucket: string },
    res: Response,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: objectFile.bucket,
        Key: objectFile.key,
      });

      const response = await this.client.send(command);

      // Set headers
      res.set({
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": response.ContentLength?.toString(),
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
        "ETag": response.ETag,
      });

      // Stream the body to response
      if (response.Body instanceof Readable) {
        response.Body.pipe(res);
      } else if (response.Body) {
        // For web streams, convert to Node.js readable
        const webStream = response.Body as ReadableStream;
        const reader = webStream.getReader();

        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(value);
          }
        };

        pump().catch((err) => {
          console.error("Error streaming response:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error streaming file" });
          }
        });
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  /**
   * Normalize an object path from various formats
   * Handles both raw R2 URLs and /objects/ paths
   */
  normalizeObjectEntityPath(rawPath: string): string {
    // If it's already a normalized path
    if (rawPath.startsWith("/objects/")) {
      return rawPath;
    }

    // Handle R2 URLs
    if (rawPath.includes(".r2.cloudflarestorage.com") || rawPath.includes(this.publicUrl)) {
      try {
        const url = new URL(rawPath);
        const pathParts = url.pathname.split("/").filter(Boolean);

        // Remove bucket name if present
        if (pathParts[0] === this.bucketName) {
          pathParts.shift();
        }

        return `/objects/${pathParts.join("/")}`;
      } catch {
        // If URL parsing fails, return as is
        return rawPath;
      }
    }

    // Handle direct paths
    if (rawPath.startsWith("uploads/")) {
      return `/objects/${rawPath}`;
    }

    return rawPath;
  }

  /**
   * Set ACL policy for an object (stores in metadata)
   * For R2, we store the policy in object metadata
   */
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);

    if (!normalizedPath.startsWith("/objects/")) {
      return normalizedPath;
    }

    const objectKey = this.getObjectKeyFromPath(normalizedPath);

    try {
      // Get the existing object
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const existingObject = await this.client.send(getCommand);

      // Re-upload with metadata (R2 doesn't support updating metadata in place)
      // For public objects, we don't need to do anything special since 
      // public access is controlled at the bucket/custom domain level

      // Store ACL policy in metadata for reference
      const bodyBuffer = await existingObject.Body?.transformToByteArray();

      if (bodyBuffer) {
        const putCommand = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: bodyBuffer,
          ContentType: existingObject.ContentType,
          Metadata: {
            ...existingObject.Metadata,
            "acl-owner": aclPolicy.owner,
            "acl-visibility": aclPolicy.visibility,
          },
        });

        await this.client.send(putCommand);
      }
    } catch (error) {
      console.error("Error setting ACL policy:", error);
      // Don't throw - just log and continue
    }

    return normalizedPath;
  }

  /**
   * Check if a user can access an object
   */
  async canAccessObjectEntity({
    userId,
    objectPath,
    requestedPermission,
  }: {
    userId?: string;
    objectPath: string;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    const objectKey = this.getObjectKeyFromPath(objectPath);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      });

      const response = await this.client.send(command);
      const metadata = response.Metadata || {};

      const visibility = metadata["acl-visibility"];
      const owner = metadata["acl-owner"];

      // Public objects are readable by anyone
      if (visibility === "public" && requestedPermission === ObjectPermission.READ) {
        return true;
      }

      // Owner can do anything
      if (userId && owner === userId) {
        return true;
      }

      // Default: check if it's a public path (uploads are generally public)
      if (objectKey.startsWith("uploads/") && requestedPermission === ObjectPermission.READ) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking access:", error);
      return false;
    }
  }

  /**
   * Get a signed URL for accessing an object (for external services like OpenAI)
   */
  async getSignedObjectUrl(objectPath: string, ttlSec: number = 3600): Promise<string> {
    const objectKey = this.getObjectKeyFromPath(objectPath);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: ttlSec,
    });
  }

  /**
   * Get the public URL for an object (if using custom domain)
   */
  getPublicUrl(objectPath: string): string {
    const objectKey = this.getObjectKeyFromPath(objectPath);
    return `${this.publicUrl}/${objectKey}`;
  }

  /**
   * Delete an object
   */
  async deleteObject(objectPath: string): Promise<void> {
    const objectKey = this.getObjectKeyFromPath(objectPath);

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    await this.client.send(command);
  }
}

// Validate config on module load
validateR2Config();

// Export for backwards compatibility
export { ObjectPermission as ObjectPermissionEnum };
