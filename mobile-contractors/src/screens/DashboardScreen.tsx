import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";
import { useAuth } from "../context/AuthContext";

export function DashboardScreen() {
  const { session } = useAuth();

  return (
    <ScreenLayout>
      <Text style={styles.heading}>Welcome, {session?.contractor.fullName}</Text>
      <Text style={styles.subheading}>Contractor workspace overview</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Operations</Text>
        <Text style={styles.cardText}>Assigned jobs and approval activity will appear here.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Documents</Text>
        <Text style={styles.cardText}>
          Upload progress, pending submissions, and review comments will be available here.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notices</Text>
        <Text style={styles.cardText}>
          You do not have any new workspace notifications right now.
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
  cardText: {
    fontSize: 15,
    color: "#486581",
    lineHeight: 22
  }
});
