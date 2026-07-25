import { CameraView, useCameraPermissions } from "expo-camera";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";
import { COLORS, DEPT_COLORS } from "../theme";
import { BUCKET_LABELS, getBucket, getDaysLeft } from "../utils/dateUtils";

const TABS = ["Requests", "Active Loans", "Extensions", "Add Book", "Scan ID"];
const DEPARTMENTS = Object.keys(DEPT_COLORS);

export default function AdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState("Requests");
  const [requests, setRequests] = useState([]);
  const [loans, setLoans] = useState([]);
  const [notifyText, setNotifyText] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, "requests"),
      where("status", "==", "Pending"),
    );
    return onSnapshot(q, (snap) =>
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, "loans"), where("status", "==", "active"));
    return onSnapshot(q, (snap) =>
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, []);

  // ===== Request Approve/Reject =====
  const approveRequest = async (req) => {
    try {
      const bookRef = doc(db, "books", req.bookId);
      const bookSnap = await getDoc(bookRef);
      if (!bookSnap.exists() || (bookSnap.data().availableCopies ?? 0) < 1) {
        Alert.alert("No Copies Left", "এই বইয়ের কোনো কপি খালি নেই।");
        return;
      }
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (req.requestedDays || 14));

      await addDoc(collection(db, "loans"), {
        studentRoll: req.studentRoll,
        studentName: req.studentName,
        bookId: req.bookId,
        bookTitle: req.bookTitle,
        borrowDate: serverTimestamp(),
        dueDate: Timestamp.fromDate(dueDate),
        durationDays: req.requestedDays || 14,
        feeAmount: req.feeAmount || 0,
        status: "active",
        extendRequested: false,
      });
      await updateDoc(bookRef, { availableCopies: increment(-1) });
      await updateDoc(doc(db, "requests", req.id), { status: "Approved" });
    } catch (e) {
      Alert.alert("Error", "Approve করা যায়নি।");
    }
  };

  const rejectRequest = async (req) => {
    await updateDoc(doc(db, "requests", req.id), { status: "Rejected" });
  };

  // ===== Return Book =====
  const markReturned = async (loan) => {
    try {
      await updateDoc(doc(db, "loans", loan.id), {
        status: "returned",
        returnedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "books", loan.bookId), {
        availableCopies: increment(1),
      });
    } catch (e) {
      Alert.alert("Error", "Return করা যায়নি।");
    }
  };

  // ===== Extension Approve/Reject =====
  const approveExtend = async (loan) => {
    const currentDue = loan.dueDate.toDate
      ? loan.dueDate.toDate()
      : new Date(loan.dueDate);
    currentDue.setDate(currentDue.getDate() + (loan.extendRequestedDays || 7));
    await updateDoc(doc(db, "loans", loan.id), {
      dueDate: Timestamp.fromDate(currentDue),
      extendRequested: false,
      extendRequestedDays: 0,
    });
  };

  const rejectExtend = async (loan) => {
    await updateDoc(doc(db, "loans", loan.id), {
      extendRequested: false,
      extendRequestedDays: 0,
    });
  };

  // ===== Bucket Notify =====
  const sendBucketNotification = async (bucket) => {
    const message = notifyText[bucket];
    if (!message) {
      Alert.alert("লিখো", "নোটিফিকেশনের মেসেজ লিখো।");
      return;
    }
    await addDoc(collection(db, "notifications"), {
      category: bucket,
      message,
      createdAt: serverTimestamp(),
    });
    setNotifyText((prev) => ({ ...prev, [bucket]: "" }));
    Alert.alert("Sent", "নোটিফিকেশন পাঠানো হয়েছে।");
  };

  const extensionRequests = loans.filter((l) => l.extendRequested);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Librarian Panel</Text>
        <TouchableOpacity onPress={() => signOut(auth)}>
          <Text style={styles.logout}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === "Requests" && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.bookTitle}</Text>
              <Text style={styles.cardMeta}>
                {item.studentName} (Roll: {item.studentRoll}) ·{" "}
                {item.requestedDays} days
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => approveRequest(item)}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => rejectRequest(item)}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending requests.</Text>
          }
        />
      )}

      {activeTab === "Active Loans" && (
        <ScrollView contentContainerStyle={styles.listPad}>
          {["last10", "last20", "last30"].map((bucket) => {
            const bucketLoans = loans.filter(
              (l) => getBucket(getDaysLeft(l.dueDate)) === bucket,
            );
            if (bucketLoans.length === 0) return null;
            return (
              <View key={bucket} style={styles.bucketSection}>
                <Text style={styles.bucketTitle}>
                  {BUCKET_LABELS[bucket]} ({bucketLoans.length} students)
                </Text>
                {bucketLoans.map((loan) => {
                  const daysLeft = getDaysLeft(loan.dueDate);
                  return (
                    <View key={loan.id} style={styles.card}>
                      <Text style={styles.cardTitle}>{loan.bookTitle}</Text>
                      <Text style={styles.cardMeta}>
                        {loan.studentName} (Roll: {loan.studentRoll})
                      </Text>
                      <Text
                        style={
                          daysLeft < 0
                            ? styles.overdueText
                            : styles.daysLeftText
                        }
                      >
                        {daysLeft < 0
                          ? `Overdue by ${Math.abs(daysLeft)} days`
                          : `${daysLeft} days left`}
                      </Text>
                      <TouchableOpacity
                        style={styles.returnBtn}
                        onPress={() => markReturned(loan)}
                      >
                        <Text style={styles.btnText}>Mark Returned</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <View style={styles.notifyBox}>
                  <TextInput
                    style={styles.notifyInput}
                    placeholder="এই bucket এর সবার জন্য মেসেজ লিখো..."
                    value={notifyText[bucket] || ""}
                    onChangeText={(text) =>
                      setNotifyText((prev) => ({ ...prev, [bucket]: text }))
                    }
                  />
                  <TouchableOpacity
                    style={styles.notifyBtn}
                    onPress={() => sendBucketNotification(bucket)}
                  >
                    <Text style={styles.btnText}>Notify This Bucket</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {loans.length === 0 && (
            <Text style={styles.emptyText}>No active loans.</Text>
          )}
        </ScrollView>
      )}

      {activeTab === "Extensions" && (
        <FlatList
          data={extensionRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPad}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.bookTitle}</Text>
              <Text style={styles.cardMeta}>
                {item.studentName} চায় আরও {item.extendRequestedDays} দিন
              </Text>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => approveExtend(item)}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => rejectExtend(item)}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No extension requests.</Text>
          }
        />
      )}

      {activeTab === "Add Book" && <AddBookForm />}
      {activeTab === "Scan ID" && <ScanIdTab />}
    </SafeAreaView>
  );
}

function AddBookForm() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [department, setDepartment] = useState("Computer");
  const [shelfNumber, setShelfNumber] = useState("");
  const [totalCopies, setTotalCopies] = useState("1");
  const [pages, setPages] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [feeAmount, setFeeAmount] = useState("10");

  const handleAddBook = async () => {
    if (!title || !author || !totalCopies) {
      Alert.alert("তথ্য অসম্পূর্ণ", "Title, Author, এবং Copies দিতে হবে।");
      return;
    }
    try {
      await addDoc(collection(db, "books"), {
        title,
        author,
        department,
        shelfNumber: shelfNumber || "N/A",
        totalCopies: parseInt(totalCopies, 10),
        availableCopies: parseInt(totalCopies, 10),
        pages: pages ? parseInt(pages, 10) : null,
        coverImageUrl: coverImageUrl || "",
        feeAmount: parseInt(feeAmount, 10) || 0,
        status: "Available",
        borrowedBy: "",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "নতুন বই যোগ হয়েছে।");
      setTitle("");
      setAuthor("");
      setShelfNumber("");
      setTotalCopies("1");
      setPages("");
      setCoverImageUrl("");
    } catch (e) {
      Alert.alert("Error", "বই যোগ করা যায়নি।");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.listPad}>
      <Text style={styles.formLabel}>Title</Text>
      <TextInput
        style={styles.formInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Book title"
      />

      <Text style={styles.formLabel}>Author</Text>
      <TextInput
        style={styles.formInput}
        value={author}
        onChangeText={setAuthor}
        placeholder="Author name"
      />

      <Text style={styles.formLabel}>Department</Text>
      <View style={styles.chipRow}>
        {DEPARTMENTS.map((dept) => (
          <TouchableOpacity
            key={dept}
            style={[
              styles.deptChip,
              department === dept && styles.deptChipActive,
            ]}
            onPress={() => setDepartment(dept)}
          >
            <Text
              style={[
                styles.deptChipText,
                department === dept && styles.deptChipTextActive,
              ]}
            >
              {dept}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formLabel}>Shelf Number</Text>
      <TextInput
        style={styles.formInput}
        value={shelfNumber}
        onChangeText={setShelfNumber}
        placeholder="e.g. C-3"
      />

      <Text style={styles.formLabel}>Total Copies</Text>
      <TextInput
        style={styles.formInput}
        value={totalCopies}
        onChangeText={setTotalCopies}
        keyboardType="numeric"
      />

      <Text style={styles.formLabel}>Pages</Text>
      <TextInput
        style={styles.formInput}
        value={pages}
        onChangeText={setPages}
        keyboardType="numeric"
        placeholder="e.g. 240"
      />

      <Text style={styles.formLabel}>Cover Image URL (optional)</Text>
      <TextInput
        style={styles.formInput}
        value={coverImageUrl}
        onChangeText={setCoverImageUrl}
        placeholder="https://..."
        autoCapitalize="none"
      />

      <Text style={styles.formLabel}>Base Fee — 7 din এর জন্য (৳)</Text>
      <TextInput
        style={styles.formInput}
        value={feeAmount}
        onChangeText={setFeeAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.addBookBtn} onPress={handleAddBook}>
        <Text style={styles.btnText}>Add Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ScanIdTab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [studentData, setStudentData] = useState(null);
  const [scanning, setScanning] = useState(true);

  const handleScan = async ({ data }) => {
    if (!scanning) return;
    setScanning(false);

    try {
      const userSnap = await getDoc(doc(db, "users", data));
      if (userSnap.exists()) {
        const loansQ = query(
          collection(db, "loans"),
          where("studentRoll", "==", data),
          where("status", "==", "active"),
        );
        const requestsQ = query(
          collection(db, "requests"),
          where("studentRoll", "==", data),
          where("status", "==", "Pending"),
        );
        const [loansSnap, requestsSnap] = await Promise.all([
          getDocs(loansQ),
          getDocs(requestsQ),
        ]);

        setStudentData({
          ...userSnap.data(),
          activeLoans: loansSnap.docs.map((d) => d.data()),
          pendingRequests: requestsSnap.docs.map((d) => d.data()),
        });
      } else {
        Alert.alert(
          "Not Found",
          "এই Roll Number এর কোনো student পাওয়া যায়নি।",
        );
        setScanning(true);
      }
    } catch (e) {
      Alert.alert("Error", "স্ক্যান করতে সমস্যা হয়েছে।");
      setScanning(true);
    }
  };

  const scanAgain = () => {
    setStudentData(null);
    setScanning(true);
  };

  if (!permission) {
    return (
      <View style={styles.listPad}>
        <Text>লোড হচ্ছে...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.listPad, { alignItems: "center", paddingTop: 40 }]}>
        <Text
          style={{
            marginBottom: 16,
            textAlign: "center",
            color: COLORS.textSecondary,
          }}
        >
          ক্যামেরা ব্যবহারের অনুমতি দরকার QR স্ক্যান করার জন্য।
        </Text>
        <TouchableOpacity style={styles.addBookBtn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {!studentData ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanning ? handleScan : undefined}
          />
          <Text style={styles.scanHint}>
            Student এর QR কোড ক্যামেরার সামনে ধরো
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listPad}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{studentData.name}</Text>
            <Text style={styles.cardMeta}>
              Roll: {studentData.roll} · {studentData.technology} ·{" "}
              {studentData.shift} Shift
            </Text>

            <Text style={styles.bucketTitle}>
              Active Loans ({studentData.activeLoans.length})
            </Text>
            {studentData.activeLoans.length === 0 && (
              <Text style={styles.cardMeta}>কোনো বই ধার করা নেই</Text>
            )}
            {studentData.activeLoans.map((loan, i) => (
              <Text key={i} style={styles.cardMeta}>
                • {loan.bookTitle}
              </Text>
            ))}

            <Text style={[styles.bucketTitle, { marginTop: 12 }]}>
              Pending Requests ({studentData.pendingRequests.length})
            </Text>
            {studentData.pendingRequests.length === 0 && (
              <Text style={styles.cardMeta}>কোনো pending request নেই</Text>
            )}
            {studentData.pendingRequests.map((req, i) => (
              <Text key={i} style={styles.cardMeta}>
                • {req.bookTitle}
              </Text>
            ))}
          </View>
          <TouchableOpacity style={styles.addBookBtn} onPress={scanAgain}>
            <Text style={styles.btnText}>Scan Another</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.primary },
  logout: { color: COLORS.danger, fontWeight: "700" },
  tabBar: { flexGrow: 0, marginBottom: 14 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#E9EDF5",
    marginRight: 8,
    justifyContent: "center",
  },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { color: "#4A5568", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  listPad: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.primary },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    marginBottom: 10,
  },
  btnRow: { flexDirection: "row", gap: 10 },
  approveBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: 11,
    borderRadius: 10,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    padding: 11,
    borderRadius: 10,
  },
  returnBtn: {
    backgroundColor: COLORS.accent,
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyText: { textAlign: "center", color: "#8a94a6", marginTop: 30 },
  bucketSection: { marginBottom: 24 },
  bucketTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 10,
  },
  overdueText: {
    color: COLORS.danger,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 8,
  },
  daysLeftText: {
    color: COLORS.textSecondary,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 8,
  },
  notifyBox: { marginTop: 4 },
  notifyInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  notifyBtn: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 6,
    marginTop: 14,
  },
  formInput: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#E9EDF5",
  },
  deptChipActive: { backgroundColor: COLORS.primary },
  deptChipText: { fontSize: 12, color: "#4A5568", fontWeight: "600" },
  deptChipTextActive: { color: "#fff" },
  addBookBtn: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    marginTop: 26,
    marginBottom: 30,
  },
  scanHint: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
