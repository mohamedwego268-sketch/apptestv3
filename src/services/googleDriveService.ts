import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogleDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  description?: string;
}

export interface EditableProjectSessionEnvelope {
  projectTitle: string;
  version: string;
  sessionNumber: number;
  lastUpdatedISO: string;
  sessionNotes: string;
  editableConfig: {
    country: string;
    city: string;
    currency: string;
    parentName: string;
    language: string;
  };
  appState: unknown;
}

export async function listDriveFiles(
  searchQuery: string = '',
  pageSize: number = 25
): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NEEDS_AUTH');
  }

  const baseConditions = ['trashed = false'];
  if (searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    baseConditions.push(`name contains '${escaped}'`);
  }

  const params = new URLSearchParams({
    pageSize: String(pageSize),
    fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,description)',
    orderBy: 'modifiedTime desc',
    q: baseConditions.join(' and '),
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NEEDS_AUTH');
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive API error (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as { files?: DriveFileItem[] };
  return data.files || [];
}

export async function createDriveFile(
  fileName: string,
  content: string | Blob,
  mimeType: string = 'application/json',
  description?: string
): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NEEDS_AUTH');
  }

  const metadata: Record<string, string> = {
    name: fileName,
    mimeType,
  };
  if (description) {
    metadata.description = description;
  }

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append(
    'file',
    typeof content === 'string' ? new Blob([content], { type: mimeType }) : content
  );

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,description',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NEEDS_AUTH');
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive upload failed (${res.status}): ${errBody}`);
  }

  return (await res.json()) as DriveFileItem;
}

export async function updateDriveFileContent(
  fileId: string,
  content: string | Blob,
  mimeType: string = 'application/json',
  updatedDescription?: string
): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NEEDS_AUTH');
  }

  const metadata: Record<string, string> = {
    mimeType,
  };
  if (updatedDescription) {
    metadata.description = updatedDescription;
  }

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' })
  );
  form.append(
    'file',
    typeof content === 'string' ? new Blob([content], { type: mimeType }) : content
  );

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      fileId
    )}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,description`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NEEDS_AUTH');
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive update failed (${res.status}): ${errBody}`);
  }

  return (await res.json()) as DriveFileItem;
}

export async function fetchLocalProjectArchiveBlob(): Promise<Blob> {
  const res = await fetch('/Family_Space_Project_Updated.zip');
  if (!res.ok) {
    throw new Error(`Could not read local project archive (${res.status})`);
  }
  return await res.blob();
}

export async function fetchLocalStandalonePrototypeBlob(): Promise<Blob> {
  const res = await fetch('/prototype/index.html');
  if (!res.ok) {
    throw new Error(`Could not read standalone prototype HTML (${res.status})`);
  }
  return await res.blob();
}

export async function downloadDriveFileText(fileId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NEEDS_AUTH');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NEEDS_AUTH');
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive download failed (${res.status}): ${errBody}`);
  }

  return await res.text();
}

export async function deleteDriveFileById(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NEEDS_AUTH');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NEEDS_AUTH');
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Drive delete failed (${res.status}): ${errBody}`);
  }
}
