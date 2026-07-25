import { signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebaseConfig";
import { COLORS } from "../theme";

export default function ProfileScreen() {
  const { userProfile } = useAuth();
  const [activeLoans, setActiveLoans] = useState([]);

  useEffect(() => {
    if (!userProfile) return;
    const q = query(
      collection(db, "loans"),
      where("studentRoll", "==", userProfile.roll),
      where("status", "==", "active"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveLoans(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [userProfile]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <FlatList
        ListHeaderComponent={
          <View style={{ alignItems: "center" }}>
            <View style={styles.idCard}>
              <Text style={styles.cpiLabel}>CPI NEXUS LIBRARY ID</Text>
              <View style={styles.qrWrapper}>
                <QRCode value={userProfile?.roll || "0000"} size={130} />
              </View>
              <Text style={styles.name}>{userProfile?.name}</Text>
              <Text style={styles.roll}>Roll: {userProfile?.roll}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Technology</Text>
                  <Text style={styles.infoValue}>
                    {userProfile?.technology}
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Shift</Text>
                  <Text style={styles.infoValue}>{userProfile?.shift}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.sectionTitle}>
              Currently Borrowed ({activeLoans.length})
            </Text>
          </View>
        }
        data={activeLoans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.loanRow}>
            <Text style={styles.loanTitle}>{item.bookTitle}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>কোনো বই ধার করা নেই।</Text>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => signOut(auth)}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  idCard: {
    backgroundColor: COLORS.primary,
    width: "92%",
    borderRadius: 20,
    padding: 26,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  cpiLabel: {
    color: "#93C5FD",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 20,
  },
  qrWrapper: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
  },
  name: { color: "#fff", fontSize: 20, fontWeight: "800" },
  roll: { color: "#9AA5B8", fontSize: 13, marginTop: 2, marginBottom: 18 },
  infoRow: { flexDirection: "row", gap: 12, width: "100%" },
  infoBox: {
    flex: 1,
    backgroundColor: "#1B2A54",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  infoLabel: { color: "#9AA5B8", fontSize: 11 },
  infoValue: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 10,
    alignSelf: "flex-start",
    marginLeft: 20,
  },
  loanRow: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loanTitle: { fontWeight: "600", color: COLORS.primary },
  emptyText: {
    textAlign: "center",
    color: "#8a94a6",
    marginTop: 10,
    marginBottom: 10,
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#FDEBEC",
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: { color: COLORS.danger, fontWeight: "700", textAlign: "center" },
});
