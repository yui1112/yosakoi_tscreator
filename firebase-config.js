import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBghoOs2tTpgYClBhuaoRlGPfw1mQYixDc",
  authDomain: "yosakoi-tscreator.firebaseapp.com",
  projectId: "yosakoi-tscreator",
  storageBucket: "yosakoi-tscreator.firebasestorage.app",
  messagingSenderId: "353704965384",
  appId: "1:353704965384:web:62cf416d73a10a973ee8bd",
  measurementId: "G-E9WNRSMMGY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
