import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthResponse } from "../types/auth";

const AUTH_KEY = "contractor-auth";

export async function saveAuthSession(session: AuthResponse) {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export async function getAuthSession() {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  return raw ? (JSON.parse(raw) as AuthResponse) : null;
}

export async function clearAuthSession() {
  await AsyncStorage.removeItem(AUTH_KEY);
}
