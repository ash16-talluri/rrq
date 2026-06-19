import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface OfflinePackProvider {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  open_24h: boolean | null;
}

export interface OfflinePackExtra {
  name: string;
  phone: string;
  type: string;
  address: string | null;
  notes: string | null;
}

export interface OfflinePack {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  region: string | null;
  highway: string | null;
  downloaded_at: string;
  providers: OfflinePackProvider[];
  extras: OfflinePackExtra[];
}

interface RescueSchema extends DBSchema {
  packs: {
    key: string;
    value: OfflinePack;
    indexes: { "by-slug": string };
  };
}

let dbPromise: Promise<IDBPDatabase<RescueSchema>> | null = null;

function getDb() {
  if (typeof window === "undefined") {
    throw new Error("Offline store is browser-only");
  }
  if (!dbPromise) {
    dbPromise = openDB<RescueSchema>("roadrescue", 1, {
      upgrade(db) {
        const store = db.createObjectStore("packs", { keyPath: "id" });
        store.createIndex("by-slug", "slug", { unique: true });
      },
    });
  }
  return dbPromise;
}

export async function savePack(pack: OfflinePack) {
  const db = await getDb();
  await db.put("packs", pack);
}

export async function getPack(id: string) {
  const db = await getDb();
  return db.get("packs", id);
}

export async function listPacks(): Promise<OfflinePack[]> {
  const db = await getDb();
  return db.getAll("packs");
}

export async function deletePack(id: string) {
  const db = await getDb();
  await db.delete("packs", id);
}
