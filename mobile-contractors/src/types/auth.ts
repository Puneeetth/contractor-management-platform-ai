export type Contractor = {
  id: string;
  userId?: string;
  contractorId?: string;
  fullName: string;
  email: string;
  phone?: string;
  currentLocation?: string;
  customerManager?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  contractor: Contractor;
};
