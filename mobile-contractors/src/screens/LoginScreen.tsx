import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import axios from "axios";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScreenLayout } from "../components/ScreenLayout";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Validation", "Please enter email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await signIn({ email, password });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.response?.data || error.message
        : "Unable to sign in contractor. Please check API and credentials.";
      Alert.alert("Login failed", String(message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      <View style={styles.headerBlock}>
        <Text style={styles.badge}>Contractor Access</Text>
        <Text style={styles.title}>Sign in to your contractor workspace</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="contractor@company.com"
          placeholderTextColor="#7b8794"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          placeholder="Enter password"
          placeholderTextColor="#7b8794"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.button} onPress={handleLogin} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Login"}</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginTop: 24,
    marginBottom: 24
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#d9ebfb",
    color: "#0f4c81",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 16
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#102a43",
    marginBottom: 10
  },
  subtitle: {
    fontSize: 15,
    color: "#486581",
    lineHeight: 22
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#102a43",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#243b53",
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9e2ec",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#102a43",
    backgroundColor: "#f8fbff"
  },
  button: {
    backgroundColor: "#0f4c81",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700"
  },
  link: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 14,
    color: "#0f4c81",
    fontWeight: "600"
  }
});
