import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ChatMessage } from './chat';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: any;
  updatedAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

/**
 * Logs the failure with enough context to debug a rules rejection. Callers that
 * can surface a failure to the user should rethrow; callbacks (such as the
 * onSnapshot error handler) must not, since a throw there is unhandled.
 */
function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export const generateId = () => {
  // Hyphens are permitted by the chatId pattern in firestore.rules.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const subscribeToChats = (
  userId: string,
  callback: (chats: ChatSession[]) => void,
  onError?: (error: unknown) => void,
) => {
  const chatsRef = collection(db, `users/${userId}/chats`);
  const q = query(chatsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const chats: ChatSession[] = [];
    snapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() } as ChatSession);
    });
    callback(chats);
  }, (error) => {
    // Must not rethrow: this runs as a listener callback, so a throw here would
    // surface as an unhandled exception rather than reaching any caller.
    logFirestoreError(error, OperationType.LIST, `users/${userId}/chats`);
    onError?.(error);
  });
};

export const createChat = async (userId: string, title: string, initialMessages: ChatMessage[]): Promise<string> => {
  const chatId = generateId();
  const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
  try {
    await setDoc(chatRef, {
      title,
      messages: initialMessages,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return chatId;
  } catch (error) {
    logFirestoreError(error, OperationType.CREATE, `users/${userId}/chats/${chatId}`);
    throw error;
  }
};

export const updateChat = async (userId: string, chatId: string, title: string, messages: ChatMessage[]) => {
  const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
  try {
    await updateDoc(chatRef, {
      title,
      messages,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logFirestoreError(error, OperationType.UPDATE, `users/${userId}/chats/${chatId}`);
    throw error;
  }
};

export const deleteChat = async (userId: string, chatId: string) => {
  const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
  try {
    await deleteDoc(chatRef);
  } catch (error) {
    logFirestoreError(error, OperationType.DELETE, `users/${userId}/chats/${chatId}`);
    throw error;
  }
};
