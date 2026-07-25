import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { COLORS } from "../theme";
import {
  BUCKET_LABELS,
  calculateFine,
  getBucket,
  getDaysLeft,
} from "../utils/dateUtils";

const EXTEND_OPTIONS = [7, 14];

export default function MyBooksScreen() {
  const { userProfile } = useAuth();
  const [loans, setLoans] = useState([]);
  const [notification, setNotification] = useState(null);
  const [extendModal, setExtendModal] = useState(null);
  const [extendDays, setExtendDays] = useState(7);

  useEffect(() => {
    if (!userProfile) return;
    const q = query(
      collection(db, "loans"),
      where("studentRoll", "==", userProfile.roll),
      where("status", "==", "active"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoans(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [userProfile]);

  // সবচেয়ে জরুরি loan (যেটার days left সবচেয়ে কম) অনুযায়ী bucket বের করে সেই bucket এর latest notification দেখানো হচ্ছে
  useEffect(() => {
    if (loans.length === 0) {
      setNotification(null);
      return;
    }
    const soonestDaysLeft = Math.min(
      ...loans.map((l) => getDaysLeft(l.dueDate)),
    );
    const bucket = getBucket(soonestDaysLeft);
    if (!bucket) return;

    const q = query(
      collection(db, "notifications"),
      where("category", "==", bucket),
      orderBy("createdAt", "desc"),
      limit(1),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setNotification({
          ...snapshot.docs[0].data(),
          daysLeft: soonestDaysLeft,
        });
      } else {
        setNotification(null);
      }
    });
    return unsubscribe;
  }, [loans]);

  const requestExtend = async () => {
    try {
      await updateDoc(doc(db, "loans", extendModal.id), {
        extendRequested: true,
        extendRequestedDays: extendDays,
      });
      setExtendModal(null);
      Alert.alert(
        "Request Sent",
        "মেয়াদ বাড়ানোর অনুরোধ Librarian এর কাছে পাঠানো হয়েছে।",
      );
    } catch (e) {
      Alert.alert("Error", "Request পাঠানো যায়নি।");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>My Borrowed Books</Text>

      {notification && (
        <View style={styles.notifBanner}>
          <Text style={styles.notifCategory}>
            {BUCKET_LABELS[notification.category]}
          </Text>
          <Text style={styles.notifMessage}>{notification.message}</Text>
          <Text style={styles.notifDays}>
            তোমার আর {notification.daysLeft} দিন বাকি আছে।
          </Text>
        </View>
      )}

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        renderItem={({ item }) => {
          const daysLeft = getDaysLeft(item.dueDate);
          const isOverdue = daysLeft < 0;
          const fine = calculateFine(daysLeft);

          return (
            <View style={styles.card}>
              <Text style={styles.bookTitle}>{item.bookTitle}</Text>
              <Text style={styles.meta}>
                Borrowed for {item.durationDays} days
              </Text>

              {isOverdue ? (
                <View style={styles.fineBox}>
                  <Text style={styles.fineText}>
                    Overdue by {Math.abs(daysLeft)} day(s)
                  </Text>
                  <Text style={styles.fineAmount}>Fine: ৳{fine}</Text>
                </View>
              ) : (
                <Text style={daysLeft <= 3 ? styles.dueSoon : styles.dueNormal}>
                  {daysLeft} Day{daysLeft === 1 ? "" : "s"} Left
                </Text>
              )}

              {item.extendRequested ? (
                <Text style={styles.extendPending}>
                  Extension Requested ({item.extendRequestedDays} days) —
                  অপেক্ষমান
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.extendBtn}
                  onPress={() => {
                    setExtendModal(item);
                    setExtendDays(7);
                  }}
                >
                  <Text style={styles.extendBtnText}>Request Extension</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You haven't borrowed any books yet.
          </Text>
        }
      />

      <Modal visible={!!extendModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setExtendModal(null)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              Extend "{extendModal?.bookTitle}"
            </Text>
            <View style={styles.durationRow}>
              {EXTEND_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationChip,
                    extendDays === d && styles.durationChipActive,
                  ]}
                  onPress={() => setExtendDays(d)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      extendDays === d && styles.durationTextActive,
                    ]}
                  >
                    +{d} days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={requestExtend}>
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
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 12,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  notifBanner: {
    backgroundColor: COLORS.warningBg,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  notifCategory: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.warningText,
    textTransform: "uppercase",
  },
  notifMessage: { fontSize: 13, color: COLORS.warningText, marginTop: 4 },
  notifDays: {
    fontSize: 12,
    color: COLORS.warningText,
    marginTop: 4,
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookTitle: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  dueNormal: { color: COLORS.success, fontWeight: "700", fontSize: 13 },
  dueSoon: { color: COLORS.danger, fontWeight: "700", fontSize: 13 },
  fineBox: {
    backgroundColor: "#FDEBEC",
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  fineText: { color: COLORS.danger, fontWeight: "700", fontSize: 13 },
  fineAmount: {
    color: COLORS.danger,
    fontWeight: "900",
    fontSize: 16,
    marginTop: 4,
  },
  extendBtn: {
    marginTop: 10,
    backgroundColor: "#E9EDF5",
    paddingVertical: 9,
    borderRadius: 10,
  },
  extendBtnText: {
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  extendPending: {
    marginTop: 10,
    color: "#CA8A04",
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: 16,
  },
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
  confirmBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 12,
  },
  confirmBtnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
