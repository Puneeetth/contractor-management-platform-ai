import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenLayout } from "../components/ScreenLayout";

const jobs = [
  {
    id: "JOB-101",
    title: "HVAC inspection",
    status: "In Progress"
  },
  {
    id: "JOB-102",
    title: "Electrical panel repair",
    status: "Scheduled"
  },
  {
    id: "JOB-103",
    title: "Site safety verification",
    status: "Pending"
  }
];

export function JobsScreen() {
  return (
    <ScreenLayout>
      <Text style={styles.heading}>Assigned Jobs</Text>
      {jobs.map((job) => (
        <View key={job.id} style={styles.card}>
          <Text style={styles.jobId}>{job.id}</Text>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.status}>{job.status}</Text>
        </View>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#102a43",
    marginTop: 12,
    marginBottom: 18
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14
  },
  jobId: {
    fontSize: 12,
    fontWeight: "700",
    color: "#829ab1",
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#243b53",
    marginBottom: 8
  },
  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#d9ebfb",
    color: "#0f4c81",
    fontSize: 12,
    fontWeight: "700"
  }
});
