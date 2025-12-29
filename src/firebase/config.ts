// Firebase 설정 및 초기화
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase 프로젝트 설정
// TODO: Firebase 콘솔에서 받은 설정으로 교체하세요
const firebaseConfig = {
  apiKey: "AIzaSyBQvV-N7j4K0KA9U7u9mn6oizdYvwNE9CA",
  authDomain: "template-tester-1540c.firebaseapp.com",
  projectId: "template-tester-1540c",
  storageBucket: "template-tester-1540c.firebasestorage.app",
  messagingSenderId: "219580497462",
  appId: "1:219580497462:web:72596766a26c5da4d9e297",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(app);

// Authentication 인스턴스
export const auth = getAuth(app);

export default app;
