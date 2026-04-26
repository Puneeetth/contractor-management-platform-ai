import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { AuthResponse, LoginPayload } from "../types/auth";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

type BackendContractorResponse = {
  id: number;
  userId?: number;
  contractorId?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  currentLocation?: string;
  customerManager?: string;
};

function mapContractor(contractor: BackendContractorResponse) {
  return {
    id: String(contractor.id),
    userId: contractor.userId ? String(contractor.userId) : undefined,
    contractorId: contractor.contractorId,
    fullName: contractor.name,
    email: contractor.email,
    phone: contractor.phoneNumber,
    currentLocation: contractor.currentLocation,
    customerManager: contractor.customerManager
  };
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete api.defaults.headers.common.Authorization;
}

export async function loginContractor(payload: LoginPayload): Promise<AuthResponse> {
  const loginResponse = await api.post<string>("/auth/login", payload);
  const token = typeof loginResponse.data === "string" ? loginResponse.data : "";

  if (!token) {
    throw new Error("Backend login did not return a token.");
  }

  setAuthToken(token);

  try {
    const profileResponse = await api.get<BackendContractorResponse>(
      `/contractors/email/${encodeURIComponent(payload.email)}`
    );

    return {
      token,
      contractor: mapContractor(profileResponse.data)
    };
  } catch (error) {
    setAuthToken(null);
    throw error;
  }
}
