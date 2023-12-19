import { faker } from "@faker-js/faker";
import { Firestore } from "@google-cloud/firestore";
import { FirestoreStore } from "./firestore.store";

/**
 * Going to populate a fake database with 100 sessions.
 */
const fakeDatabaseValues: {
  [storeName: string]: { [sessionId: string]: any };
} = {};

function fillDatabase() {
  fakeDatabaseValues.sessions = {};
  for (let i = 0; i < 100; i++) {
    const id = faker.string.uuid();
    fakeDatabaseValues.sessions[id] = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };
  }
}

describe("firestore.store", () => {
  let db: Firestore;
  let store: FirestoreStore;

  beforeEach(() => {
    fillDatabase();

    db = {
      collection: (kind: string) => {
        return {
          doc: (sid: string) => {
            return {
              get: () => {
                return Promise.resolve({
                  exists: fakeDatabaseValues[kind]?.[sid] !== undefined,
                  data: () => fakeDatabaseValues[kind]?.[sid],
                });
              },
              set: (data: any, opts: any) => {
                fakeDatabaseValues[kind][sid] = data;
                return Promise.resolve();
              },
              delete: () => {
                const exists = fakeDatabaseValues[kind]?.[sid] !== undefined;

                if (!exists)
                  return Promise.reject(new Error("Session not found"));

                delete fakeDatabaseValues[kind][sid];
                return Promise.resolve();
              },
            };
          },
          get: () => {
            return Promise.resolve({
              docs: Object.keys(fakeDatabaseValues[kind]).map((id) => ({
                exists: true,
                data: () => fakeDatabaseValues[kind][id],
              })),
              forEach(cb: any) {
                cb({
                  exists: true,
                  ref: kind,
                  data: () => fakeDatabaseValues[kind],
                });
              },
            });
          },
        };
      },
      batch: () => {
        return {
          commit: () => {
            return Promise.resolve();
          },
          delete: (ref: string) => {
            fakeDatabaseValues["sessions"] = {};
            return;
          },
        };
      },
    } as object as Firestore;

    store = new FirestoreStore({ database: db });
  });

  it("should be defined", () => {
    expect(store).toBeDefined();
  });

  it("should have a get method", () => {
    expect(store.get).toBeDefined();
  });

  it("should have a set method", () => {
    expect(store.set).toBeDefined();
  });

  it("should have a destroy method", () => {
    expect(store.destroy).toBeDefined();
  });

  it("should set default collection name", () => {
    expect(store["collection"]).toBe("sessions");
  });

  it("should set custom collection name", () => {
    store = new FirestoreStore({ database: db, collection: "custom" });
    expect(store["collection"]).toBe("custom");
  });

  it("should set default merge option", () => {
    expect(store["merge"]).toBe(true);
  });

  it("should set custom merge option", () => {
    store = new FirestoreStore({ database: db, merge: false });
    expect(store["merge"]).toBe(false);
  });

  it("should throw error is db.collection.doc.set fails", () => {
    const error = new Error("Test error");
    const database = {
      collection: (kind: string) => {
        return {
          doc: (sid: string) => {
            return {
              get: () => {
                return Promise.resolve({
                  exists: fakeDatabaseValues[kind]?.[sid] !== undefined,
                  data: () => fakeDatabaseValues[kind]?.[sid],
                });
              },
              set: (data: any, opts: any) => {
                fakeDatabaseValues[kind][sid] = data;
                return Promise.reject(error);
              },
            };
          },
          get: () => {
            return Promise.resolve({
              docs: Object.keys(fakeDatabaseValues[kind]).map((id) => ({
                exists: true,
                data: () => fakeDatabaseValues[kind][id],
              })),
            });
          },
        };
      },
    } as object as Firestore;

    store = new FirestoreStore({ database });
    store.set("123", {}).catch((err) => {
      expect(err).toBe(error);
    });
  });

  it("should throw error is db.collection.doc.get fails", () => {
    const error = new Error("Test error");
    const database = {
      collection: (kind: string) => {
        return {
          doc: (sid: string) => {
            return {
              get: () => {
                return Promise.reject(error);
              },
              set: (data: any, opts: any) => {
                fakeDatabaseValues[kind][sid] = data;
                return Promise.resolve();
              },
            };
          },
          get: () => {
            return Promise.resolve({
              docs: Object.keys(fakeDatabaseValues[kind]).map((id) => ({
                exists: true,
                data: () => fakeDatabaseValues[kind][id],
              })),
            });
          },
        };
      },
    } as object as Firestore;

    store = new FirestoreStore({ database });
    store.set("123", {}).catch((err) => {
      expect(err).toBe(error);
    });
  });

  it("should throw error getting session that does not exist", async () => {
    const sid = faker.string.uuid();
    await expect(store.get(sid)).rejects.toThrow("Session not found");
  });

  it("should destroy session", async () => {
    const sid = faker.string.uuid();
    await store.set(sid, {});
    await store.destroy(sid);
    await expect(store.get(sid)).rejects.toThrow("Session not found");
  });

  it("should throw trying to delete data that does not exist", async () => {
    const sid = faker.string.uuid();
    await expect(store.destroy(sid)).rejects.toThrow("Session not found");
  });

  it("should set data", async () => {
    const sid = faker.string.uuid();
    const data = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };

    await store.set(sid, data);
    expect(store.get(sid)).resolves.toEqual(data);
  });
});
