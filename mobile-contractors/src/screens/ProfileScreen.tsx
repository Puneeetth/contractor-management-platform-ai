import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { useAuth } from "../context/AuthContext";

export function ProfileScreen() {
  const { session, signOut } = useAuth();
  const contractor = session?.contractor;

  return (
    <ScreenLayout>
      <View style={styles.card}>
        <Text style={styles.name}>{contractor?.fullName}</Text>
        <Text style={styles.line}>{contractor?.email}</Text>
        <Text style={styles.line}>{contractor?.phone || "No phone added"}</Text>
        <Text style={styles.line}>
          {contractor?.contractorId ? `Contractor ID: ${contractor.contractorId}` : "No contractor ID added"}
        </Text>
        <Text style={styles.line}>
          {contractor?.currentLocation ? `Location: ${contractor.currentLocation}` : "No location added"}
        </Text>
      </View>

      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginTop: 24
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#102a43",
    marginBottom: 12
  },
  line: {
    fontSize: 15,
    color: "#486581",
    marginBottom: 10
  },
  button: {
    marginTop: 20,
    backgroundColor: "#102a43",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center"
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16
  }
});
