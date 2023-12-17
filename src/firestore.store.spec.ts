import { Firestore } from "@google-cloud/firestore";
import { FirestoreStore } from "./firestore.store";

const mockFirestore = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  set: jest.fn(),
};

describe("firestore.store", () => {
  let db: Firestore;
  let store: FirestoreStore;

  beforeEach(() => {
    db = new Firestore();

    db.collection = mockFirestore.collection;
    db.doc = mockFirestore.doc;

    store = new FirestoreStore({ database: db });
  });

  it("should be defined", () => {
    expect(store).toBeDefined();
  });
});
