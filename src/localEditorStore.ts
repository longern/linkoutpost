import { createProfile, type LinkProfile } from "./profile";

const dbName = "linkoutpost-editor";
const dbVersion = 1;
const profileStore = "profiles";
const assetStore = "assets";
const activeProfileKey = "active";
const legacyOfflineKey = "linkoutpost:offline-profile";

type StoredAsset = {
  blob: Blob;
  id: string;
  name: string;
  type: string;
  updatedAt: string;
};

function readLegacyProfile(): LinkProfile | null {
  const raw = window.localStorage.getItem(legacyOfflineKey);
  if (!raw) return null;

  try {
    return createProfile(JSON.parse(raw) as Partial<LinkProfile>);
  } catch {
    return null;
  }
}

function writeLegacyProfile(profile: LinkProfile): void {
  window.localStorage.setItem(legacyOfflineKey, JSON.stringify(profile));
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(profileStore)) {
        db.createObjectStore(profileStore);
      }

      if (!db.objectStoreNames.contains(assetStore)) {
        db.createObjectStore(assetStore, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function getFromStore<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);

    return await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    });
  } finally {
    db.close();
  }
}

async function putInStore(storeName: string, value: unknown, key?: IDBValidKey): Promise<void> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    if (key === undefined) {
      store.put(value);
    } else {
      store.put(value, key);
    }

    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function readLocalProfile(): Promise<LinkProfile> {
  if (!("indexedDB" in window)) {
    return readLegacyProfile() ?? createProfile();
  }

  try {
    const stored = await getFromStore<LinkProfile>(profileStore, activeProfileKey);
    if (stored) return createProfile(stored);

    const legacy = readLegacyProfile();
    if (legacy) {
      await writeLocalProfile(legacy);
      return legacy;
    }
  } catch {
    return readLegacyProfile() ?? createProfile();
  }

  return createProfile();
}

export async function writeLocalProfile(profile: LinkProfile): Promise<void> {
  if (!("indexedDB" in window)) {
    writeLegacyProfile(profile);
    return;
  }

  try {
    await putInStore(profileStore, profile, activeProfileKey);
  } catch {
    writeLegacyProfile(profile);
  }
}

export async function saveLocalAsset(file: File): Promise<StoredAsset> {
  const asset: StoredAsset = {
    blob: file,
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || "application/octet-stream",
    updatedAt: new Date().toISOString()
  };

  if (!("indexedDB" in window)) {
    throw new Error("IndexedDB is required for local image storage");
  }

  await putInStore(assetStore, asset);
  return asset;
}

export async function readLocalAsset(id: string): Promise<StoredAsset | null> {
  if (!("indexedDB" in window)) return null;

  try {
    return await getFromStore<StoredAsset>(assetStore, id);
  } catch {
    return null;
  }
}

export async function readLocalAssetAsDataUrl(id: string): Promise<string | null> {
  const asset = await readLocalAsset(id);
  if (!asset) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(asset.blob);
  });
}
