import { useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [books, setBooks] = useState([
    {
      id: "1",
      title: "ডাটা স্ট্রাকচার ও অ্যালগরিদম",
      authoFr: "মোঃ লুৎফুর রহমান",
      category: "কম্পিউটার",
      status: "Available",
    },
    {
      id: "2",
      title: "ইলেকট্রনিক্স ফান্ডামেন্টালস",
      author: "রবার্ট এল. বয়লেস্ট্যাড",
      category: "ইলেকট্রনিক্স",
      status: "Available",
    },
    {
      id: "3",
      title: "অ্যাডভান্সড জাভা প্রোগ্রামিং",
      author: "হার্বার্ট শিল্ডট",
      category: "কম্পিউটার",
      status: "Borrowed",
    },
    {
      id: "4",
      title: "মেকানিকাল ইঞ্জিনিয়ারিং ম্যাটেরিয়ালস",
      author: "কে. সি. জৈন",
      category: "মেকানিকাল",
      status: "Available",
    },
    {
      id: "5",
      title: "সিভিল ইঞ্জিনিয়ারিং ড্রয়িং",
      author: "জি. সি. বন্দ্যোপাধ্যায়",
      category: "সিভিল",
      status: "Borrowed",
    },
  ]);

  const categories = ["All", "Computer", "Electronics", "Mechanical", "Civil"];

  const handleLogin = () => {
    if (email === "" || password === "") {
      Alert.alert("ত্রুটি", "অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।");
      return;
    }
    setIsLoggedIn(true);
  };

  const toggleBorrow = (id) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) => {
        if (book.id === id) {
          const nextStatus =
            book.status === "Available" ? "Borrowed" : "Available";
          return { ...book, status: nextStatus };
        }
        return book;
      }),
    );
  };

  const filteredBooks =
    selectedCategory === "সব"
      ? books
      : books.filter((b) => b.category === selectedCategory);

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <StatusBar backgroundColor="#0F172A" barStyle="light-content" />
        <View style={styles.loginCard}>
          <Text style={styles.instituteText}>
            চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট
          </Text>
          <Text style={styles.systemText}>লাইব্রেরি ম্যানেজমেন্ট সিস্টেম</Text>

          <TextInput
            style={styles.input}
            placeholder="পলিটেকনিক ইমেইল"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="পাসওয়ার্ড"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>লগইন করুন</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F8FAFC" barStyle="dark-content" />

      <View style={styles.headerArea}>
        <View>
          <Text style={styles.headerTitle}>সেন্ট্রাল লাইব্রেরি</Text>
          <Text style={styles.headerSub}>চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setIsLoggedIn(false)}
        >
          <Text style={styles.logoutText}>লগআউট</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.catChip,
                selectedCategory === item && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.catText,
                  selectedCategory === item && styles.catTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          বইয়ের তালিকা ({filteredBooks.length})
        </Text>
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.bookCard}>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>লেখক: {item.author}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.catBadge}>
                    <Text style={styles.catBadgeText}>{item.category}</Text>
                  </View>
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "Available" ? styles.green : styles.red,
                    ]}
                  >
                    ●{" "}
                    {item.status === "Available"
                      ? "Available"
                      : "ধার দেওয়া / Borrowed"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  item.status === "Available"
                    ? styles.borrowBg
                    : styles.returnBg,
                ]}
                onPress={() => toggleBorrow(item.id)}
              >
                <Text style={styles.actionBtnText}>
                  {item.status === "Available" ? "ধার নিন" : "ফেরত দিন"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#1E293B",
    padding: 25,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 8,
  },
  instituteText: {
    fontSize: 18,
    color: "#38BDF8",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 5,
  },
  systemText: {
    fontSize: 22,
    color: "#F8FAFC",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 25,
  },
  input: {
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#334155",
  },
  loginButton: {
    backgroundColor: "#38BDF8",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  loginButtonText: {
    color: "#0F172A",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  container: { flex: 1, backgroundColor: "#F8FAFC", paddingTop: 10 },
  headerArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#0F172A" },
  headerSub: { fontSize: 14, color: "#64748B" },
  logoutBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: { color: "#EF4444", fontWeight: "bold", fontSize: 12 },

  categoryContainer: { paddingHorizontal: 20, marginBottom: 15, maxHeight: 45 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 20,
    marginRight: 10,
    justifyContent: "center",
  },
  catChipActive: { backgroundColor: "#0284C7" },
  catText: { color: "#475569", fontWeight: "600", fontSize: 14 },
  catTextActive: { color: "#FFFFFF" },

  listContainer: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 10,
  },
  bookCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bookInfo: { flex: 1, marginRight: 10 },
  bookTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  bookAuthor: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center" },
  catBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 10,
  },
  catBadgeText: { fontSize: 11, color: "#475569", fontWeight: "600" },
  statusText: { fontSize: 12, fontWeight: "bold" },
  green: { color: "#16A34A" },
  red: { color: "#DC2626" },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 75,
  },
  borrowBg: { backgroundColor: "#0284C7" },
  returnBg: { backgroundColor: "#475569" },
  actionBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
});
