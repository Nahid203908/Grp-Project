import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNmG8kk1P2HbOI10V0ssZUk8W3QBs6dIQ",
  authDomain: "cpilibrary-d07c1.firebaseapp.com",
  projectId: "cpilibrary-d07c1",
  storageBucket: "cpilibrary-d07c1.firebasestorage.app",
  messagingSenderId: "727386848994",
  appId: "1:727386848994:web:4b34e6c32e9569e64428bb",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// এইটাই মূল ফিক্স — AsyncStorage দিয়ে session সেভ থাকবে,
// অ্যাপ বন্ধ করে আবার খুললেও লগইন করা লাগবে না, যতক্ষণ না নিজে Log Out করছ
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
