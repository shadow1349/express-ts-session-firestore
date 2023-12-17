# Express TS Session Firestore Store

This is an extension to the Store class in [Express TS Session](https://github.com/shadow1349/express-ts-session) to manage session data in [Firestore](https://cloud.google.com/firestore).

# Installation

`npm install express-ts-session-firestore`

# Usage

```typescript
import { ExpressTSSession, Cookie } from "express-ts-sesion";
import express from 'express';
import FirestoreStore from 'express-ts-session-firestore';
import { Firestore } from '@google-cloud/firestore';

const sessionMiddleware = new ExpressTSSession({
    name: "my-app"
    secret: "mysecret",

    cookie: new Cookie({
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: false,
        httpOnly: true,
        path: "/",
        sameSite: false,
        signed: true,
    }),

    store: new FirestoreStore({ database: new Firestore() }),
});

const app = express();

app.use(sessionMiddleware.init);
```
