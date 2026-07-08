import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { useState, useEffect } from 'react';

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Monkeypatch localStorage.setItem to gracefully handle QuotaExceededError (e.g., of chix9ja_users cache)
if (typeof window !== 'undefined' && window.localStorage) {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalGetItem = localStorage.getItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  const memoryBackup: Record<string, string> = {};

  // Hydrate memoryBackup on boot
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        memoryBackup[k] = originalGetItem(k) || '';
      }
    }
  } catch (e) {
    console.warn("Could not hydrate memoryBackup:", e);
  }

  localStorage.getItem = (key: string) => {
    try {
      const val = originalGetItem(key);
      if (val !== null) return val;
    } catch (e) {
      console.warn(`Local storage getItem failed for key "${key}":`, e);
    }
    return memoryBackup[key] !== undefined ? memoryBackup[key] : null;
  };

  localStorage.removeItem = (key: string) => {
    delete memoryBackup[key];
    try {
      originalRemoveItem(key);
    } catch (e) {
      console.warn(`Local storage removeItem failed for key "${key}":`, e);
    }
  };

  localStorage.setItem = (key: string, value: string) => {
    // Always update memory backup
    memoryBackup[key] = value;

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
            
            // Helper to clean large fields inside a single user object to save space (e.g. Base64 proofs)
            const cleanUserPayload = (u: any, isSelf: boolean) => {
              if (!u) return u;
              const cleaned = { ...u };
              // Limit transactions
              cleaned.transactions = u.transactions ? (isSelf ? u.transactions.slice(0, 10) : []) : [];
              
              // Strip any values that are very large (strings > 1000 chars, e.g. base64 screenshots)
              for (const k in cleaned) {
                if (typeof cleaned[k] === 'string' && cleaned[k].length > 1000) {
                  cleaned[k] = ""; // strip base64 content in localStorage cache
                }
              }
              return cleaned;
            };

            const pruned: Record<string, any> = {};
            for (const email in usersObj) {
              const u = usersObj[email];
              if (!u) continue;
              const isSelf = activeEmail && email.toLowerCase() === activeEmail;
              pruned[email] = cleanUserPayload(u, !!isSelf);
            }
            
            const prunedStr = JSON.stringify(pruned);
            memoryBackup[key] = prunedStr;
            originalSetItem(key, prunedStr);
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
                  // Clean self object too
                  const cleanedSelf = { ...selfObj };
                  for (const k in cleanedSelf) {
                    if (typeof cleanedSelf[k] === 'string' && cleanedSelf[k].length > 1000) {
                      cleanedSelf[k] = "";
                    }
                  }
                  if (cleanedSelf.transactions) {
                    cleanedSelf.transactions = cleanedSelf.transactions.slice(0, 5);
                  }
                  const finalStr = JSON.stringify({ [activeEmail]: cleanedSelf });
                  memoryBackup[key] = finalStr;
                  originalSetItem(key, finalStr);
                  return;
                }
              }
              localStorage.removeItem(key);
            } catch (e2) {
              console.error("Could not recover from quota error even after radical prune. Falling back to in-memory store.", e2);
            }
          }
        }
      } else {
        console.error(`LocalStorage.setItem failed for key "${key}":`, error);
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

// Global Bank Details Config Manager
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: "Paga",
  accountNumber: "0435119272",
  accountName: "Marvelous Michael O"
};

export function useBankDetails() {
  const [bankDetails, setBankDetails] = useState<BankDetails>(DEFAULT_BANK_DETAILS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'bank');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBankDetails({
          bankName: data.bankName || DEFAULT_BANK_DETAILS.bankName,
          accountNumber: data.accountNumber || DEFAULT_BANK_DETAILS.accountNumber,
          accountName: data.accountName || DEFAULT_BANK_DETAILS.accountName,
        });
      } else {
        setBankDetails(DEFAULT_BANK_DETAILS);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading bank settings from Firestore:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { bankDetails, loading };
}

export async function updateBankDetails(details: BankDetails): Promise<void> {
  const docRef = doc(db, 'settings', 'bank');
  await setDoc(docRef, {
    bankName: details.bankName,
    accountNumber: details.accountNumber,
    accountName: details.accountName
  });
}

// Global Giveaway Settings Config Manager
export interface GiveawaySettings {
  unlocked: boolean;
}

export function useGiveawayStatus() {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'giveaway');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUnlocked(!!data.unlocked);
      } else {
        setUnlocked(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading giveaway settings from Firestore:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { unlocked, loading };
}

export async function updateGiveawayStatus(unlocked: boolean): Promise<void> {
  const docRef = doc(db, 'settings', 'giveaway');
  await setDoc(docRef, { unlocked });
}

// Global App Socials & Channels Config Manager
export interface AppChannels {
  telegramChannel: string;
  whatsappChannel: string;
  supportTelegram: string;
  vendorTelegram: string;
}

export const DEFAULT_APP_CHANNELS: AppChannels = {
  telegramChannel: "https://t.me/chix9ja",
  whatsappChannel: "https://whatsapp.com/channel/0029Vb8arfH59PwbSshxov1M",
  supportTelegram: "https://t.me/chix9jaservice",
  vendorTelegram: "https://t.me/chix9ja_vendor"
};

export function useAppChannels() {
  const [channels, setChannels] = useState<AppChannels>(DEFAULT_APP_CHANNELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'channels');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChannels({
          telegramChannel: data.telegramChannel || DEFAULT_APP_CHANNELS.telegramChannel,
          whatsappChannel: data.whatsappChannel || DEFAULT_APP_CHANNELS.whatsappChannel,
          supportTelegram: data.supportTelegram || DEFAULT_APP_CHANNELS.supportTelegram,
          vendorTelegram: data.vendorTelegram || DEFAULT_APP_CHANNELS.vendorTelegram,
        });
      } else {
        setChannels(DEFAULT_APP_CHANNELS);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading channel settings from Firestore:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { channels, loading };
}

export async function updateAppChannels(channels: AppChannels): Promise<void> {
  const docRef = doc(db, 'settings', 'channels');
  await setDoc(docRef, {
    telegramChannel: channels.telegramChannel,
    whatsappChannel: channels.whatsappChannel,
    supportTelegram: channels.supportTelegram,
    vendorTelegram: channels.vendorTelegram
  });
}


