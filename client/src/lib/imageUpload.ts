import { fetchApi } from './config';

export async function uploadImage(file: File): Promise<string> {
  // Use server-proxied upload to avoid browser-to-R2 SSL/CORS issues on localhost
  const uploadRes = await fetchApi('/api/objects/upload-proxied', {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('Upload response:', uploadRes.status, errorText);
    throw new Error(`Failed to upload image: ${uploadRes.status}`);
  }

  const { objectPath } = await uploadRes.json();
  return objectPath;
}
