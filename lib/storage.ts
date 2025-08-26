import type { StorageReference, UploadResult, FullMetadata, FirebaseStorage } from "firebase/storage"
import { getFirebaseApp } from "./firebase"

let storageInstance: FirebaseStorage | null = null

const getStorageInstance = async (): Promise<FirebaseStorage> => {
  if (typeof window === "undefined") {
    throw new Error("Storage can only be used on the client side")
  }

  if (!storageInstance) {
    const { getStorage } = await import("firebase/storage")
    const app = getFirebaseApp()
    storageInstance = getStorage(app)
  }

  return storageInstance
}

// Upload a file
export const uploadFile = async (path: string, file: File, metadata?: any): Promise<UploadResult> => {
  try {
    const { ref, uploadBytes } = await import("firebase/storage")
    const storage = await getStorageInstance()
    const storageRef = ref(storage, path)
    const result = await uploadBytes(storageRef, file, metadata)
    return result
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// Upload multiple files
export const uploadFiles = async (files: { path: string; file: File; metadata?: any }[]): Promise<UploadResult[]> => {
  try {
    const uploadPromises = files.map(({ path, file, metadata }) => uploadFile(path, file, metadata))
    const results = await Promise.all(uploadPromises)
    return results
  } catch (error) {
    console.error("Error uploading files:", error)
    throw error
  }
}

// Get download URL
export const getDownloadURL = async (path: string): Promise<string> => {
  try {
    const { ref, getDownloadURL: getURL } = await import("firebase/storage")
    const storage = await getStorageInstance()
    const storageRef = ref(storage, path)
    const url = await getURL(storageRef)
    return url
  } catch (error) {
    console.error("Error getting download URL:", error)
    throw error
  }
}

// Delete a file
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const { ref, deleteObject } = await import("firebase/storage")
    const storage = await getStorageInstance()
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// Get file metadata
export const getFileMetadata = async (path: string): Promise<FullMetadata> => {
  try {
    const { ref, getMetadata } = await import("firebase/storage")
    const storage = await getStorageInstance()
    const storageRef = ref(storage, path)
    const metadata = await getMetadata(storageRef)
    return metadata
  } catch (error) {
    console.error("Error getting file metadata:", error)
    throw error
  }
}

// List files in a directory
export const listFiles = async (path: string): Promise<StorageReference[]> => {
  try {
    const { ref, listAll } = await import("firebase/storage")
    const storage = await getStorageInstance()
    const storageRef = ref(storage, path)
    const result = await listAll(storageRef)
    return result.items
  } catch (error) {
    console.error("Error listing files:", error)
    throw error
  }
}

export { getStorageInstance }
