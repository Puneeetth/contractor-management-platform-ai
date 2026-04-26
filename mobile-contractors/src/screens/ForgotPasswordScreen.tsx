import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";

export function ForgotPasswordScreen() {
  return (
    <ScreenLayout>
      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.description}>
          Connect this screen to your Spring Boot contractor password reset endpoint or
          replace it with your existing reset flow from the web app.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginTop: 40
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#102a43",
    marginBottom: 12
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#486581"
  }
});
