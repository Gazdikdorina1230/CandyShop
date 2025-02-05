const admin = require('firebase-admin');
require('dotenv').config(); // Környezeti változók betöltése


const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // A kulcs helyes formázása
  };

// Inicializáljuk a Firebase Admin SDK-t
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://candyshop-67a32-default-rtdb.europe-west1.firebasedatabase.app"
  });

const db = admin.firestore();
module.exports = db;
