import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../firebaseConfig";
import { COLORS } from "../theme";

const departments = [
  "Computer",
  "Civil",
  "Electrical",
  "Electronics",
  "Mechanical",
  "Power",
  "Environmental",
];

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [technology, setTechnology] = useState("Computer");
  const [shift, setShift] = useState("1st");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !roll || !password) {
      Alert.alert("তথ্য অসম্পূর্ণ", "সব ঘর পূরণ করুন।");
      return;
    }
    setLoading(true);
    const email = `${roll.trim()}@cpi.edu.bd`;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", roll.trim()), {
        name,
        roll: roll.trim(),
        technology,
        shift,
        role: "student",
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join CPI Nexus Library</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Roll Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 786319"
          keyboardType="numeric"
          value={roll}
          onChangeText={setRoll}
        />

        <Text style={styles.label}>Technology</Text>
        <View style={styles.chipRow}>
          {departments.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[styles.chip, technology === dept && styles.chipActive]}
              onPress={() => setTechnology(dept)}
            >
              <Text
                style={[
                  styles.chipText,
                  technology === dept && styles.chipTextActive,
                ]}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Shift</Text>
        <View style={styles.shiftRow}>
          {["1st", "2nd"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.shiftBtn, shift === s && styles.shiftBtnActive]}
              onPress={() => setShift(s)}
            >
              <Text
                style={[
                  styles.shiftText,
                  shift === s && styles.shiftTextActive,
                ]}
              >
                {s} Shift
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 26, paddingBottom: 50 },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 26 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "#E9EDF5",
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, color: "#4A5568", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  shiftRow: { flexDirection: "row", gap: 10 },
  shiftBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#E9EDF5",
    alignItems: "center",
  },
  shiftBtnActive: { backgroundColor: COLORS.accent },
  shiftText: { fontWeight: "600", color: "#4A5568" },
  shiftTextActive: { color: "#fff" },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 14,
    marginTop: 30,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  linkText: {
    color: COLORS.accent,
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
  },
});
