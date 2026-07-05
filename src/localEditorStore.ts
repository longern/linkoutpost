import { createProfile, normalizeHandle, type LinkProfile } from "./profile";
import type { ProfileSummary } from "./types";

const dbName = "linkoutpost-editor";
const dbVersion = 1;
const profileStore = "profiles";
const assetStore = "assets";
const activeProfileKey = "active";
const activeHandleKey = "active-handle";
const profileKeyPrefix = "handle:";
const legacyOfflineKey = "linkoutpost:offline-profile";
const localProfilesKey = "linkoutpost:offline-profiles";
const localActiveHandleKey = "linkoutpost:offline-active-handle";

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

function profileKey(handle: string): string {
  return `${profileKeyPrefix}${normalizeHandle(handle)}`;
}

function toSummary(profile: LinkProfile): ProfileSummary {
  return {
    handle: profile.handle,
    title: profile.title,
    updatedAt: profile.updatedAt,
  };
}

function readLocalStorageProfiles(): LinkProfile[] {
  const raw = window.localStorage.getItem(localProfilesKey);
  if (!raw) {
    const legacy = readLegacyProfile();
    return legacy ? [legacy] : [];
  }

  try {
    const profiles = JSON.parse(raw) as Partial<LinkProfile>[];
    return profiles.map((profile) => createProfile(profile));
  } catch {
    const legacy = readLegacyProfile();
    return legacy ? [legacy] : [];
  }
}

function writeLocalStorageProfiles(profiles: LinkProfile[]): void {
  window.localStorage.setItem(localProfilesKey, JSON.stringify(profiles));
}

function readLocalStorageActiveHandle(): string {
  return normalizeHandle(window.localStorage.getItem(localActiveHandleKey) ?? "");
}

function writeLocalStorageActiveHandle(handle: string): void {
  window.localStorage.setItem(localActiveHandleKey, normalizeHandle(handle));
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

async function deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.delete(key);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

async function getAllProfilesFromStore(): Promise<LinkProfile[]> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(profileStore, "readonly");
    const store = transaction.objectStore(profileStore);

    return await new Promise((resolve, reject) => {
      const profiles: LinkProfile[] = [];
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(profiles);
          return;
        }

        if (typeof cursor.key === "string" && cursor.key.startsWith(profileKeyPrefix)) {
          profiles.push(createProfile(cursor.value as Partial<LinkProfile>));
        }
        cursor.continue();
      };
    });
  } finally {
    db.close();
  }
}

export async function readLocalProfileSummaries(): Promise<ProfileSummary[]> {
  if (!("indexedDB" in window)) {
    return readLocalStorageProfiles().map(toSummary).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  try {
    const profiles = await getAllProfilesFromStore();
    return profiles.map(toSummary).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return readLocalStorageProfiles().map(toSummary).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export async function readLocalProfile(): Promise<LinkProfile> {
  if (!("indexedDB" in window)) {
    const profiles = readLocalStorageProfiles();
    const activeHandle = readLocalStorageActiveHandle();
    return (
      profiles.find((storedProfile) => storedProfile.handle === activeHandle) ??
      profiles[0] ??
      createProfile()
    );
  }

  try {
    const activeHandle = await getFromStore<string>(profileStore, activeHandleKey);
    if (activeHandle) {
      const stored = await getFromStore<LinkProfile>(profileStore, profileKey(activeHandle));
      if (stored) return createProfile(stored);
    }

    const profiles = await getAllProfilesFromStore();
    if (profiles[0]) {
      await putInStore(profileStore, profiles[0].handle, activeHandleKey);
      return profiles[0];
    }

    const stored = await getFromStore<LinkProfile>(profileStore, activeProfileKey);
    if (stored) {
      const profile = createProfile(stored);
      await writeLocalProfile(profile);
      return profile;
    }

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
  const nextProfile = createProfile({
    ...profile,
    handle: normalizeHandle(profile.handle) || "your_handle",
  });

  if (!("indexedDB" in window)) {
    const profiles = readLocalStorageProfiles().filter(
      (storedProfile) => storedProfile.handle !== nextProfile.handle,
    );
    profiles.push(nextProfile);
    writeLocalStorageProfiles(profiles);
    writeLocalStorageActiveHandle(nextProfile.handle);
    writeLegacyProfile(nextProfile);
    return;
  }

  try {
    await putInStore(profileStore, nextProfile, profileKey(nextProfile.handle));
    await putInStore(profileStore, nextProfile.handle, activeHandleKey);
    await putInStore(profileStore, nextProfile, activeProfileKey);
  } catch {
    writeLegacyProfile(nextProfile);
  }
}

export async function readLocalProfileByHandle(handle: string): Promise<LinkProfile | null> {
  const normalizedHandle = normalizeHandle(handle);
  if (!normalizedHandle) return null;

  if (!("indexedDB" in window)) {
    const profile = readLocalStorageProfiles().find(
      (storedProfile) => storedProfile.handle === normalizedHandle,
    );
    if (profile) writeLocalStorageActiveHandle(profile.handle);
    return profile ?? null;
  }

  try {
    const stored = await getFromStore<LinkProfile>(profileStore, profileKey(normalizedHandle));
    if (!stored) return null;
    const profile = createProfile(stored);
    await putInStore(profileStore, profile.handle, activeHandleKey);
    await putInStore(profileStore, profile, activeProfileKey);
    return profile;
  } catch {
    return null;
  }
}

export async function deleteLocalProfile(handle: string): Promise<LinkProfile> {
  const normalizedHandle = normalizeHandle(handle);

  if (!("indexedDB" in window)) {
    const profiles = readLocalStorageProfiles().filter(
      (storedProfile) => storedProfile.handle !== normalizedHandle,
    );
    const nextProfile = profiles[0] ?? createProfile();
    writeLocalStorageProfiles(profiles.length > 0 ? profiles : [nextProfile]);
    writeLocalStorageActiveHandle(nextProfile.handle);
    writeLegacyProfile(nextProfile);
    return nextProfile;
  }

  try {
    await deleteFromStore(profileStore, profileKey(normalizedHandle));
    const profiles = await getAllProfilesFromStore();
    const nextProfile = profiles[0] ?? createProfile();
    if (profiles.length === 0) {
      await putInStore(profileStore, nextProfile, profileKey(nextProfile.handle));
    }
    await putInStore(profileStore, nextProfile.handle, activeHandleKey);
    await putInStore(profileStore, nextProfile, activeProfileKey);
    return nextProfile;
  } catch {
    return createProfile();
  }
}

export async function saveLocalAsset(file: File): Promise<StoredAsset> {
  return saveLocalAssetBlob(file, file.name, file.type);
}

export async function saveLocalAssetBlob(
  blob: Blob,
  name: string,
  type = blob.type,
): Promise<StoredAsset> {
  const asset: StoredAsset = {
    blob,
    id: crypto.randomUUID(),
    name,
    type: type || "application/octet-stream",
    updatedAt: new Date().toISOString(),
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
