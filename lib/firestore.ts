import type {
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  Query,
  QueryConstraint,
  Firestore,
} from "firebase/firestore"
import { getFirebaseApp } from "./firebase"

let firestoreInstance: Firestore | null = null

const getFirestoreInstance = async (): Promise<Firestore> => {
  if (typeof window === "undefined") {
    throw new Error("Firestore can only be used on the client side")
  }

  if (!firestoreInstance) {
    const { getFirestore } = await import("firebase/firestore")
    const app = getFirebaseApp()
    firestoreInstance = getFirestore(app)
  }

  return firestoreInstance
}

// Add a document to a collection
export const addDocument = async (
  collectionPath: string,
  data: DocumentData,
): Promise<DocumentReference<DocumentData>> => {
  try {
    const { collection, addDoc } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const collectionRef = collection(db, ...collectionPath.split("/"))
    const docRef = await addDoc(collectionRef, data)
    return docRef
  } catch (error) {
    console.error("Error adding document:", error)
    throw error
  }
}

// Set a document with a specific ID
// firestore.ts
export const setDocument = async (
  collectionPath: string,
  docId: string,
  data: DocumentData,
): Promise<void> => {
  try {
    const { doc, setDoc } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const docRef = doc(db, ...collectionPath.split("/"), docId)
    // ✅ ใช้ merge: true เพื่อให้เพิ่มฟิลด์ภายหลังได้โดยไม่ทับทั้ง doc
    await setDoc(docRef, data, { merge: true })
  } catch (error) {
    console.error("Error setting document:", error)
    throw error
  }
}


// Get a document by ID
export const getDocument = async (
  collectionPath: string,
  docId: string,
): Promise<QueryDocumentSnapshot<DocumentData> | null> => {
  try {
    const { doc, getDoc } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const docRef = doc(db, ...collectionPath.split("/"), docId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap as QueryDocumentSnapshot<DocumentData>
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting document:", error)
    throw error
  }
}

// Get all documents from a collection
export const getDocuments = async (
  collectionPath: string,
  ...queryConstraints: QueryConstraint[]
): Promise<QueryDocumentSnapshot<DocumentData>[]> => {
  try {
    const { collection, query, getDocs } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const collectionRef = collection(db, ...collectionPath.split("/"))

    let q: Query<DocumentData>
    if (queryConstraints.length > 0) {
      q = query(collectionRef, ...queryConstraints)
    } else {
      q = collectionRef
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs
  } catch (error) {
    console.error("Error getting documents:", error)
    throw error
  }
}

// Update a document
export const updateDocument = async (
  collectionPath: string,
  docId: string,
  data: Partial<DocumentData>,
): Promise<void> => {
  try {
    const { doc, updateDoc } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const docRef = doc(db, ...collectionPath.split("/"), docId)
    await updateDoc(docRef, data)
  } catch (error) {
    console.error("Error updating document:", error)
    throw error
  }
}

// Delete a document
export const deleteDocument = async (collectionPath: string, docId: string): Promise<void> => {
  try {
    const { doc, deleteDoc } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const docRef = doc(db, ...collectionPath.split("/"), docId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting document:", error)
    throw error
  }
}

// Listen to real-time updates
export const subscribeToDocument = async (
  collectionPath: string,
  docId: string,
  callback: (doc: QueryDocumentSnapshot<DocumentData> | null) => void,
): Promise<() => void> => {
  try {
    const { doc, onSnapshot } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const docRef = doc(db, ...collectionPath.split("/"), docId)

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap as QueryDocumentSnapshot<DocumentData>)
      } else {
        callback(null)
      }
    })

    return unsubscribe
  } catch (error) {
    console.error("Error subscribing to document:", error)
    throw error
  }
}

// Listen to collection updates
export const subscribeToCollection = async (
  collectionPath: string,
  callback: (docs: QueryDocumentSnapshot<DocumentData>[]) => void,
  ...queryConstraints: QueryConstraint[]
): Promise<() => void> => {
  try {
    const { collection, query, onSnapshot } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const collectionRef = collection(db, ...collectionPath.split("/"))

    let q: Query<DocumentData>
    if (queryConstraints.length > 0) {
      q = query(collectionRef, ...queryConstraints)
    } else {
      q = collectionRef
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      callback(querySnapshot.docs)
    })

    return unsubscribe
  } catch (error) {
    console.error("Error subscribing to collection:", error)
    throw error
  }
}

export const subscribeToCollectionGroup = async (
  collectionId: string,
  callback: (docs: QueryDocumentSnapshot<DocumentData>[]) => void,
  ...queryConstraints: QueryConstraint[]
): Promise<() => void> => {
  try {
    const { collectionGroup, query: createQuery, onSnapshot } = await import("firebase/firestore")
    const db = await getFirestoreInstance()
    const collectionQuery = collectionGroup(db, collectionId)

    let q: Query<DocumentData>
    if (queryConstraints.length > 0) {
      q = createQuery(collectionQuery, ...queryConstraints)
    } else {
      q = collectionQuery
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      callback(querySnapshot.docs)
    })

    return unsubscribe
  } catch (error) {
    console.error("Error subscribing to collection group:", error)
    throw error
  }
}

export { getFirestoreInstance }
