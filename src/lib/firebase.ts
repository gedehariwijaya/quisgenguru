import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Quiz } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without specifying firestoreDatabaseId */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as required by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline. Checking network or configuration.");
    }
  }
}
testConnection();

// Google Sign-In
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign-out
export const logoutFirebase = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Save a single quiz to Cloud Firestore
export const saveQuizToFirestore = async (userId: string, quiz: Quiz): Promise<void> => {
  const path = `users/${userId}/quizzes/${quiz.id}`;
  try {
    const sanitizedQuiz = {
      ...quiz,
      userId,
      userEmail: auth.currentUser?.email || '',
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userId, 'quizzes', quiz.id), sanitizedQuiz);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Delete a quiz from Cloud Firestore
export const deleteQuizFromFirestore = async (userId: string, quizId: string): Promise<void> => {
  const path = `users/${userId}/quizzes/${quizId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'quizzes', quizId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Save user profile to Cloud Firestore
export const saveProfileToFirestore = async (
  userId: string, 
  data: { name: string; email: string; institution?: string; subjectSpecialty?: string }
): Promise<void> => {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      userId,
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Subscribe to quizzes collection in real-time
export const subscribeToQuizzes = (
  userId: string,
  onUpdate: (quizzes: Quiz[]) => void,
  onError?: (error: Error) => void
) => {
  const path = `users/${userId}/quizzes`;
  const q = query(collection(db, 'users', userId, 'quizzes'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Quiz[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Quiz);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
};
