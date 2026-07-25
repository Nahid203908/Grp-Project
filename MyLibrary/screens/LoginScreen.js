import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Logo from "../components/Logo";
import { auth } from "../firebaseConfig";
import { COLORS } from "../theme";

export default function LoginScreen({ navigation }) {
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!roll || !password) {
      Alert.alert("তথ্য অসম্পূর্ণ", "Roll Number এবং Password দুটোই দিন।");
      return;
    }
    setLoading(true);
    const email = `${roll.trim().toLowerCase()}@cpi.edu.bd`;

    signInWithEmailAndPassword(auth, email, password)
      .catch(() =>
        Alert.alert("Login Failed", "Roll Number অথবা Password সঠিক নয়।"),
      )
      .finally(() => setLoading(false));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Logo size={96} />
        <Text style={styles.title}>CPI Nexus Library</Text>
        <Text style={styles.subtitle}>Chattogram Polytechnic Institute</Text>

        <TextInput
          style={styles.input}
          placeholder="Roll Number"
          placeholderTextColor="#8a94a6"
          autoCapitalize="none"
          value={roll}
          onChangeText={setRoll}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8a94a6"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 18,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#9AA5B8",
    textAlign: "center",
    marginBottom: 34,
  },

  input: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 16,
    width: "100%",
  },
  primaryBtn: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    width: "100%",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
  },
  linkText: {
    color: "#93C5FD",
    textAlign: "center",
    marginTop: 22,
    fontSize: 14,
    fontWeight: "600",
  },
});
