import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBQvV-N7j4K0KA9U7u9mn6oizdYvwNE9CA",
  authDomain: "template-tester-1540c.firebaseapp.com",
  projectId: "template-tester-1540c",
  storageBucket: "template-tester-1540c.firebasestorage.app",
  messagingSenderId: "219580497462",
  appId: "1:219580497462:web:72596766a26c5da4d9e297",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// 개발 환경에서는 Functions 에뮬레이터로 연결 (Daily 학습 AI 프록시)
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export default app;
