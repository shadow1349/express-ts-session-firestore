import { Firestore } from "@google-cloud/firestore";
import { CookieModel, SessionDataModel, Store } from "express-ts-session";

export interface FirestoreStoreOptions {
  database: Firestore;
  /**
   * The name of the collection to store the session data in.
   * @default "sessions"
   */
  collection?: string;
  /**
   * Whether to merge the session data into the Firestore document.
   * - `true` will merge the session data into the Firestore document.
   * - `false` will overwrite the Firestore document with the session data.
   * @default true
   */
  merge?: boolean;
}

/**
 * Will handle storing, retrieving, and destroying sessions session data Firestore.
 * @class FirestoreStore
 */
export class FirestoreStore extends Store {
  private db: Firestore;
  private collection = "sessions";
  private merge = true;

  constructor(
    options: FirestoreStoreOptions,
    genid?: (req: Request) => string | Promise<string>,
    cookieOptions: Partial<CookieModel> = {}
  ) {
    super(genid, cookieOptions);

    this.db = options.database;

    if (options.collection) this.collection = options.collection;
    if (options.merge) this.merge = options.merge;
  }

  override async get(sid: string) {
    const data = this.db
      .collection(this.collection)
      .doc(sid)
      .get()
      .then((response) => {
        if (!response.exists) throw new Error("Session not found");
        return response.data() as SessionDataModel;
      })
      .catch((error) => {
        throw error;
      });
    return data;
  }

  override async set(sid: string, sess: SessionDataModel) {
    await this.db
      .collection(this.collection)
      .doc(sid)
      .set(sess, { merge: this.merge })
      .catch((error) => {
        throw error;
      });

    return;
  }

  override async destroy(sid: string) {
    await this.db
      .collection(this.collection)
      .doc(sid)
      .delete()
      .catch((error) => {
        throw error;
      });

    return;
  }

  async clear() {
    const batch = this.db.batch();
    const snapshot = await this.db.collection(this.collection).get();

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit().catch((error) => {
      throw error;
    });

    return;
  }

  /**
   * This will return an array of all the sessions in the collection. Be careful running this on a large collection
   * as it will return all the data in the collection and call a read for each document. This could become costly if you
   * do it too often.
   * @returns {Promise<SessionDataModel[]>} All session data in the collection.
   */
  async all() {
    const snapshot = await this.db.collection(this.collection).get();
    const data = snapshot.docs.map((doc) => doc.data() as SessionDataModel);

    return data;
  }
}
