import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

export function ScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f7fb"
  },
  content: {
    flexGrow: 1,
    padding: 20
  }
});
