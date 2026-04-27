import { Platform } from "react-native";

const DEFAULT_WEB_API_BASE_URL = "http://localhost:8080/api";
const DEFAULT_NATIVE_API_BASE_URL = "http://192.168.1.5:8080/api";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === "web" ? DEFAULT_WEB_API_BASE_URL : DEFAULT_NATIVE_API_BASE_URL);
