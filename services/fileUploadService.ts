// services/fileUploadService.ts

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';

export type FileType = 'pdf' | 'image' | 'text' | 'audio' | 'word';

export interface UploadedFile {
  id: string;
  userId: string;
  fileName: string;
  fileType: FileType;
  downloadURL: string;
  uploadedAt: Date;
  size: number;
  mimeType: string;
}

/**
 * Uploads a file to Firebase Storage
 */
export async function uploadFile(
  file: File | Blob,
  userId: string,
  fileName?: string
): Promise<UploadedFile> {
  const timestamp = Date.now();
  const uploadId = `${userId}_${timestamp}`;
  const name = fileName || file.name || `upload_${timestamp}`;
  const fileType = detectFileType(file, name);
  const storagePath = `users/${userId}/uploads/${uploadId}/${name}`;

  const storageRef = ref(storage, storagePath);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return {
    id: uploadId,
    userId,
    fileName: name,
    fileType,
    downloadURL,
    uploadedAt: new Date(),
    size: file.size,
    mimeType: file.type || getMimeTypeFromExtension(name),
  };
}

/**
 * Uploads text content as a file
 */
export async function uploadTextContent(
  text: string,
  userId: string,
  fileName: string = 'text_content.txt'
): Promise<UploadedFile> {
  const timestamp = Date.now();
  const uploadId = `${userId}_${timestamp}`;
  const storagePath = `users/${userId}/uploads/${uploadId}/${fileName}`;
  const storageRef = ref(storage, storagePath);
  
  await uploadString(storageRef, text, 'raw');
  const downloadURL = await getDownloadURL(storageRef);
  
  return {
    id: uploadId,
    userId,
    fileName,
    fileType: 'text',
    downloadURL,
    uploadedAt: new Date(),
    size: new Blob([text]).size,
    mimeType: 'text/plain',
  };
}

/**
 * Detects file type from file object and name
 */
function detectFileType(file: File | Blob, fileName: string): FileType {
  const name = fileName.toLowerCase();
  const mimeType = file.type?.toLowerCase() || '';
  
  if (name.endsWith('.pdf') || mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (name.endsWith('.doc') || name.endsWith('.docx') || mimeType.includes('word') || mimeType.includes('document')) {
    return 'word';
  }
  if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name)) {
    return 'image';
  }
  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(name)) {
    return 'audio';
  }
  return 'text';
}

/**
 * Gets MIME type from file extension
 */
function getMimeTypeFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Validates file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|jpg|jpeg|png|gif|mp3|wav)$/i)) {
    return { valid: false, error: 'File type not supported' };
  }
  
  return { valid: true };
}

