import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { useAuth } from "../context/AuthContext";

export function DashboardScreen() {
  const { session } = useAuth();

  return (
    <ScreenLayout>
      <Text style={styles.heading}>Welcome, {session?.contractor.fullName}</Text>
      <Text style={styles.subheading}>Contractor mobile dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Summary</Text>
        <Text style={styles.cardValue}>3 assigned jobs</Text>
        <Text style={styles.cardText}>1 site visit pending approval</Text>
        <Text style={styles.cardText}>2 documents waiting for upload</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Notes</Text>
        <Text style={styles.cardText}>
          Keep this screen limited to contractor information, approvals, schedules, and work
          status only.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#102a43",
    marginTop: 12
  },
  subheading: {
    color: "#486581",
    fontSize: 15,
    marginBottom: 18,
    marginTop: 8
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f4c81",
    marginBottom: 12
  },
  cardValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#102a43",
    marginBottom: 8
  },
  cardText: {
    fontSize: 15,
    color: "#486581",
    lineHeight: 22
  }
});
