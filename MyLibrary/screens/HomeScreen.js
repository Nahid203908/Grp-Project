import { Image } from "expo-image";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { COLORS, DEPT_COLORS } from "../theme";

const DEPARTMENTS = [
  "All",
  "Computer",
  "Electrical",
  "Electronics",
  "Mechanical",
  "Civil",
  "Environmental",
  "Power",
  "Others",
];
const DURATION_OPTIONS = [7, 14, 30];

function AnimatedCard({ children, index }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: Math.min(index * 40, 300),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay: Math.min(index * 40, 300),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { userProfile } = useAuth();
  const [allBooks, setAllBooks] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [modalBook, setModalBook] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(14);
  const [alreadyRequested, setAlreadyRequested] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "books"), (snapshot) => {
      setAllBooks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    const q = query(
      collection(db, "requests"),
      where("studentRoll", "==", userProfile.roll),
      where("status", "==", "Pending"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlreadyRequested(snapshot.docs.map((d) => d.data().bookId));
    });
    return unsubscribe;
  }, [userProfile]);

  const filteredBooks = allBooks.filter((book) => {
    const matchesDept = activeDept === "All" || book.department === activeDept;
    const q = searchText.toLowerCase();
    const matchesSearch =
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  // fee এখন duration অনুযায়ী বাড়ে: 7 din = base, 14 din = base*2, 30 din = base*3
  const calculateFeeForDuration = (baseFee, duration) => {
    const multiplier = duration === 7 ? 1 : duration === 14 ? 2 : 3;
    return (baseFee || 10) * multiplier;
  };

  const openBorrowModal = (book) => {
    setSelectedDuration(14);
    setModalBook(book);
  };

  const confirmRequest = async () => {
    try {
      const computedFee = calculateFeeForDuration(
        modalBook.feeAmount,
        selectedDuration,
      );
      await addDoc(collection(db, "requests"), {
        studentRoll: userProfile.roll,
        studentName: userProfile.name,
        bookId: modalBook.id,
        bookTitle: modalBook.title,
        coverImageUrl: modalBook.coverImageUrl || "",
        requestedDays: selectedDuration,
        feeAmount: computedFee,
        requestTime: serverTimestamp(),
        status: "Pending",
      });
      setModalBook(null);
      Alert.alert("Request Sent", "Librarian এর অনুমোদনের অপেক্ষায় আছে।");
    } catch (e) {
      Alert.alert("Error", "Request পাঠানো যায়নি।");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.greeting}>
        Hello, {userProfile?.name?.split(" ")[0] || "Student"} 👋
      </Text>
      <Text style={styles.subGreeting}>Find your next book</Text>

      <TextInput
        style={styles.searchBar}
        placeholder="Search by title or author"
        placeholderTextColor="#8a94a6"
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={styles.deptListWrapper}>
        <FlatList
          data={DEPARTMENTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingRight: 20, paddingLeft: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.deptChip,
                activeDept === item && styles.deptChipActive,
              ]}
              onPress={() => setActiveDept(item)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.deptChipText,
                  activeDept === item && styles.deptChipTextActive,
                ]}
                numberOfLines={1}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 30,
          paddingTop: 10,
        }}
        renderItem={({ item, index }) => {
          const isAvailable = (item.availableCopies ?? 0) > 0;
          const alreadyPending = alreadyRequested.includes(item.id);
          const deptColor =
            DEPT_COLORS[item.department] || COLORS.textSecondary;

          return (
            <AnimatedCard index={index}>
              <View style={styles.card}>
                <Image
                  source={
                    item.coverImageUrl ? { uri: item.coverImageUrl } : undefined
                  }
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.cardInfo}>
                  <View
                    style={[
                      styles.deptBadge,
                      { backgroundColor: deptColor + "20" },
                    ]}
                  >
                    <Text style={[styles.deptBadgeText, { color: deptColor }]}>
                      {item.department}
                    </Text>
                  </View>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.author}>by {item.author}</Text>
                  <Text style={styles.meta}>
                    Shelf: {item.shelfNumber || "N/A"} ·{" "}
                    {item.pages ? `${item.pages}p` : "N/A"}
                  </Text>
                  <Text style={styles.meta}>
                    Base Fee (7 din): ৳{item.feeAmount ?? 10}
                  </Text>

                  {isAvailable ? (
                    <Text style={styles.statusAvailable}>
                      Available ({item.availableCopies} copies)
                    </Text>
                  ) : (
                    <Text style={styles.statusBorrowed}>
                      All copies borrowed
                    </Text>
                  )}

                  {isAvailable && !alreadyPending && (
                    <TouchableOpacity
                      style={styles.requestBtn}
                      onPress={() => openBorrowModal(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.requestBtnText}>
                        Request to Borrow
                      </Text>
                    </TouchableOpacity>
                  )}
                  {alreadyPending && (
                    <Text style={styles.pendingText}>Request Pending...</Text>
                  )}
                </View>
              </View>
            </AnimatedCard>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No books found.</Text>
        }
      />

      <Modal visible={!!modalBook} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalBook(null)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>Borrow "{modalBook?.title}"</Text>
            <Text style={styles.modalLabel}>কত দিনের জন্য নিতে চাও?</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationChip,
                    selectedDuration === d && styles.durationChipActive,
                  ]}
                  onPress={() => setSelectedDuration(d)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      selectedDuration === d && styles.durationTextActive,
                    ]}
                  >
                    {d} days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalFee}>
              Fee: ৳
              {calculateFeeForDuration(modalBook?.feeAmount, selectedDuration)}{" "}
              (লাইব্রেরিয়ানকে ক্যাশে দিতে হবে)
            </Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={confirmRequest}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Send Request</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  subGreeting: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchBar: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deptListWrapper: { marginBottom: 14 },
  deptChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#E9EDF5",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  deptChipActive: { backgroundColor: COLORS.primary },
  deptChipText: { color: "#4A5568", fontWeight: "600", fontSize: 13 },
  deptChipTextActive: { color: "#fff" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: "row",
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  cover: {
    width: 78,
    height: 106,
    borderRadius: 10,
    backgroundColor: "#E9EDF5",
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  deptBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  deptBadgeText: { fontSize: 10, fontWeight: "700" },
  bookTitle: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  author: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  meta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  statusAvailable: {
    color: COLORS.success,
    fontWeight: "700",
    marginTop: 6,
    fontSize: 12,
  },
  statusBorrowed: {
    color: COLORS.danger,
    fontWeight: "700",
    marginTop: 6,
    fontSize: 12,
  },
  requestBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  requestBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
  },
  pendingText: {
    color: "#CA8A04",
    fontWeight: "700",
    marginTop: 8,
    fontSize: 12,
  },
  emptyText: { textAlign: "center", color: "#8a94a6", marginTop: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    padding: 30,
  },
  modalBox: { backgroundColor: "#fff", borderRadius: 18, padding: 22 },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 12,
  },
  modalLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  durationRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  durationChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#E9EDF5",
    alignItems: "center",
  },
  durationChipActive: { backgroundColor: COLORS.accent },
  durationText: { fontWeight: "700", color: "#4A5568", fontSize: 13 },
  durationTextActive: { color: "#fff" },
  modalFee: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
  },
  confirmBtnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
