import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Monkeypatch localStorage.setItem to gracefully handle QuotaExceededError (e.g., of chix9ja_users cache)
if (typeof window !== 'undefined' && window.localStorage) {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    try {
      originalSetItem(key, value);
    } catch (error) {
      if (error instanceof Error && (
        error.name === 'QuotaExceededError' || 
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
        error.message.includes('quota') || 
        error.message.includes('Quota')
      )) {
        console.warn(`LocalStorage quota exceeded for key "${key}". Attempting to prune...`);
        if (key === 'chix9ja_users') {
          try {
            const usersObj = JSON.parse(value);
            const activeEmail = localStorage.getItem('chix9ja_active_session')?.toLowerCase().trim();
            
            const pruned: Record<string, any> = {};
            for (const email in usersObj) {
              const u = usersObj[email];
              if (!u) continue;
              const isSelf = activeEmail && email.toLowerCase() === activeEmail;
              pruned[email] = {
                ...u,
                // Keep only last 10 transactions for self, clear for others to save quota
                transactions: u.transactions ? (isSelf ? u.transactions.slice(0, 10) : []) : []
              };
            }
            
            originalSetItem(key, JSON.stringify(pruned));
            console.log("Successfully stored pruned user cache to local storage after quota exceeded.");
            return;
          } catch (innerErr) {
            console.error("Critical error while pruning users cache for localStorage:", innerErr);
            try {
              const activeEmail = localStorage.getItem('chix9ja_active_session')?.toLowerCase().trim();
              if (activeEmail) {
                const usersObj = JSON.parse(value);
                const selfObj = usersObj[activeEmail];
                if (selfObj) {
                  originalSetItem(key, JSON.stringify({ [activeEmail]: selfObj }));
                  return;
                }
              }
              localStorage.removeItem(key);
            } catch (e2) {
              console.error("Could not recover from quota error:", e2);
            }
          }
        }
      } else {
        throw error;
      }
    }
  };
}

// Helper to sanitize undefined values recursively for Firestore compatibility
export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        newObj[key] = sanitizeForFirestore(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// Synchronize local storage state changes made by specific subcomponents back to Firestore
export async function syncUserFromLocalToFirestore(email: string): Promise<void> {
  try {
    const emailKey = email.toLowerCase().trim();
    const existingUsersStr = localStorage.getItem('chix9ja_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : {};
    const currentUser = existingUsers[emailKey];
    if (currentUser) {
      const sanitized = sanitizeForFirestore(currentUser);
      await setDoc(doc(db, 'users', emailKey), sanitized);
    }
  } catch (e) {
    console.error("Local sync error:", e);
  }
}


// Validate Connection to Firestore on boot as per guidelines
async function testConnection() {
  try {
    const testDocRef = doc(db, 'test-connection-placeholder', 'connectivity');
    await getDocFromServer(testDocRef);
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration. You appear to be offline.");
    }
  }
}
testConnection();

// Structured Firestore error handler
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
  }
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
