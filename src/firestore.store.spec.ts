import { Firestore } from "@google-cloud/firestore";
import { FirestoreStore } from "./firestore.store";

describe("firestore.store", () => {
  let db: Firestore;
  let store: FirestoreStore;

  beforeEach(() => {
    db = new Firestore();
    store = new FirestoreStore({ database: db });
  });
});
