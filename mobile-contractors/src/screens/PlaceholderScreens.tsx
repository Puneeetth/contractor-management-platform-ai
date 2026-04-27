import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";

export const ExpensesScreen = () => (
  <ScreenLayout>
    <View style={styles.container}>
      <Text style={styles.title}>Expenses</Text>
      <Text style={styles.description}>Expense claims, policy checks, and payment tracking will appear here.</Text>
    </View>
  </ScreenLayout>
);

export const BankAccountScreen = () => (
  <ScreenLayout>
    <View style={styles.container}>
      <Text style={styles.title}>Bank Account</Text>
      <Text style={styles.description}>Payout account details and verification state will appear here.</Text>
    </View>
  </ScreenLayout>
);

export const ConfigurationScreen = () => (
  <ScreenLayout>
    <View style={styles.container}>
      <Text style={styles.title}>Configuration</Text>
      <Text style={styles.description}>Contractor workspace preferences and application controls will appear here.</Text>
    </View>
  </ScreenLayout>
);

export const SupportScreen = () => (
  <ScreenLayout>
    <View style={styles.container}>
      <Text style={styles.title}>Support</Text>
      <Text style={styles.description}>Help center links, contact options, and ticket updates will appear here.</Text>
    </View>
  </ScreenLayout>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginTop: 8
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#102a43",
    marginBottom: 10
  },
  description: {
    fontSize: 15,
    color: "#486581",
    lineHeight: 22
  }
});
