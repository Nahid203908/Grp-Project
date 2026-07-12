import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ১. তোমার ফায়ারবেস কনফিগারেশন এখানে বসাও
const firebaseConfig = {
  apiKey: "AIzaSyBNmG8kk1P2HbOI10V0ssZUk8W3QBs6dIQ",
  authDomain: "cpilibrary-d07c1.firebaseapp.com",
  projectId: "cpilibrary-d07c1",
  storageBucket: "cpilibrary-d07c1.firebasestorage.app",
  messagingSenderId: "727386848994",
  appId: "1:727386848994:web:4b34e6c32e9569e64428bb",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("Login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [allBooks, setAllBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");

  const departments = [
    { id: "all", name: "সব বই" },
    { id: "computer", name: "Computer" },
    { id: "electrical", name: "Electrical" },
    { id: "civil", name: "Civil" },
    { id: "electronics", name: "Electronics" },
    { id: "environmental", name: "Environmental" },
    { id: "mechanical", name: "Mechanical" },
    { id: "power", name: "Power" },
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "books"), (snapshot) => {
      const booksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllBooks(booksData);
      setFilteredBooks(booksData);
    });
    return unsubscribe;
  }, []);

  const filterDepartment = (deptId) => {
    setSelectedDept(deptId);
    if (deptId === "all") {
      setFilteredBooks(allBooks);
    } else {
      const filtered = allBooks.filter((book) => book.department === deptId);
      setFilteredBooks(filtered);
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("ভুল হয়েছে", "দয়া করে ইমেইল এবং পাসওয়ার্ড দিন।");
      return;
    }
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        setLoading(false);
        setCurrentScreen("Home");
      })
      .catch(() => {
        setLoading(false);
        Alert.alert("লগইন ব্যর্থ", "ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
      });
  };

  const handleRegister = () => {
    if (!email || !password) {
      Alert.alert("ভুল হয়েছে", "সবগুলো ঘর সঠিকভাবে পূরণ করুন।");
      return;
    }
    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        setLoading(false);
        Alert.alert("সফল", "অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে।");
        setCurrentScreen("Home");
      })
      .catch((error) => {
        setLoading(false);
        Alert.alert("রেজিস্ট্রেশন ব্যর্থ", error.message);
      });
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setCurrentScreen("Login");
      setEmail("");
      setPassword("");
    });
  };

  const toggleBorrow = async (id, currentStatus) => {
    try {
      const newStatus =
        currentStatus === "Available" ? "Borrowed" : "Available";
      await updateDoc(doc(db, "books", id), { status: newStatus });
    } catch (error) {
      Alert.alert("ত্রুটি", "ডাটাবেস আপডেট করা যায়নি।");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>অপেক্ষা করুন...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={currentScreen === "Home" ? "dark-content" : "light-content"}
      />

      {/* LOGIN SCREEN */}
      {currentScreen === "Login" && (
        <View style={styles.authContainer}>
          <View style={styles.logoWrapper}>
            {/* তোমার লোগো ফাইলটা assets ফোল্ডারে রেখে নিচের লাইনটা uncomment করো */}
            {/* <Image source={require('./assets/logo.png')} style={styles.logoImage} resizeMode="contain" /> */}
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>CPI</Text>
            </View>
          </View>
          <Text style={styles.authLogo}>CPI Library</Text>
          <Text style={styles.authSubtitle}>
            চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট
          </Text>

          <TextInput
            style={styles.input}
            placeholder="আপনার ইমেইল দিন"
            placeholderTextColor="#90a4ae"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="পাসওয়ার্ড"
            placeholderTextColor="#90a4ae"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>লগইন করুন</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen("Register")}>
            <Text style={styles.toggleAuthText}>
              নতুন অ্যাকাউন্ট তৈরি করতে এখানে চাপুন
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* REGISTER SCREEN */}
      {currentScreen === "Register" && (
        <View style={styles.authContainer}>
          <View style={styles.logoWrapper}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>CPI</Text>
            </View>
          </View>
          <Text style={styles.authLogo}>Sign Up</Text>
          <Text style={styles.authSubtitle}>
            নতুন লাইব্রেরি অ্যাকাউন্ট খুলুন
          </Text>

          <TextInput
            style={styles.input}
            placeholder="আপনার নাম"
            placeholderTextColor="#90a4ae"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="ইমেইল অ্যাড্রেস"
            placeholderTextColor="#90a4ae"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="পাসওয়ার্ড তৈরি করুন"
            placeholderTextColor="#90a4ae"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>নিবন্ধন সম্পন্ন করুন</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentScreen("Login")}>
            <Text style={styles.toggleAuthText}>
              ইতিমধ্যে অ্যাকাউন্ট থাকলে লগইন করুন
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* HOME DASHBOARD SCREEN */}
      {currentScreen === "Home" && (
        <View style={styles.mainContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.smallLogoPlaceholder}>
                <Text style={styles.smallLogoText}>CPI</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>CPI লাইব্রেরি ড্যাশবোর্ড</Text>
                <Text style={styles.headerSub}>
                  চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutBtnText}>লগআউট</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryContainer}>
            <FlatList
              data={departments}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryTab,
                    selectedDept === item.id && styles.categoryTabActive,
                  ]}
                  onPress={() => filterDepartment(item.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedDept === item.id && styles.categoryTabTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <FlatList
            data={filteredBooks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.bookTitle}>
                    {item.title || "শিরোনামহীন বই"}
                  </Text>
                  <Text style={styles.authorText}>
                    লেখক: {item.author || "অজানা লেখক"}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.deptBadge}>
                      {item.department
                        ? item.department.toUpperCase()
                        : "GENERAL"}
                    </Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          color:
                            item.status === "Available" ? "#2e7d32" : "#c62828",
                          backgroundColor:
                            item.status === "Available" ? "#e8f5e9" : "#ffebee",
                        },
                      ]}
                    >
                      {item.status === "Available" ? "Available" : "Borrowed"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.borrowBtn,
                    {
                      backgroundColor:
                        item.status === "Available" ? "#2e7d32" : "#d32f2f",
                    },
                  ]}
                  onPress={() => toggleBorrow(item.id, item.status)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.borrowBtnText}>
                    {item.status === "Available"
                      ? "বইটি ধার নিন"
                      : "বইটি ফেরত দিন"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  এই বিভাগে বর্তমানে কোনো বই নেই।
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Auth Styles
  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#1a1a2e",
  },
  logoWrapper: { alignItems: "center", marginBottom: 20 },
  logoImage: { width: 90, height: 90, borderRadius: 20 },
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  logoPlaceholderText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  authLogo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  authSubtitle: {
    fontSize: 15,
    color: "#b0b0b0",
    textAlign: "center",
    marginBottom: 35,
  },
  input: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtn: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "bold",
  },
  toggleAuthText: {
    color: "#4dabf7",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
  },

  // Dashboard Styles
  mainContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallLogoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  smallLogoText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#263238" },
  headerSub: { fontSize: 12, color: "#78909c" },
  logoutBtn: {
    backgroundColor: "#ffebee",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutBtnText: { color: "#c62828", fontWeight: "bold", fontSize: 13 },

  // Category Styles
  categoryContainer: { marginBottom: 15, height: 45 },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    marginRight: 10,
    height: 38,
  },
  categoryTabActive: { backgroundColor: "#007bff" },
  categoryTabText: { color: "#333", fontWeight: "600", fontSize: 13 },
  categoryTabTextActive: { color: "#fff" },

  // Card Styles
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#eceff1",
  },
  cardInfo: { marginBottom: 12 },
  bookTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 4,
  },
  authorText: { fontSize: 14, color: "#546e7a", marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deptBadge: {
    backgroundColor: "#cfd8dc",
    color: "#37474f",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
  },
  borrowBtn: { padding: 14, borderRadius: 10, marginTop: 5 },
  borrowBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
  emptyText: {
    color: "#90a4ae",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});
