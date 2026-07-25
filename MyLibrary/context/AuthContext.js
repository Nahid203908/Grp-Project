import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setInitializing(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const roll = firebaseUser.email.split("@")[0];

    const unsubscribeProfile = onSnapshot(doc(db, "users", roll), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile({ id: docSnap.id, ...docSnap.data() });
      }
      setInitializing(false);
    });
    return unsubscribeProfile;
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
