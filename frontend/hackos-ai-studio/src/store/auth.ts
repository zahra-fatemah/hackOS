import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "participant" | "organizer" | null;

type AuthState = {
  role: Role;
  name: string;
  email: string;
  scanCode: string;
  loginTime: number | null;
  login: (role: Exclude<Role, null>, name: string, email: string) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      name: "",
      email: "",
      scanCode: "HACKOS-2026",
      loginTime: null,
      login: (role, name, email) => set({ role, name, email, loginTime: Date.now() }),
      logout: () => set({ role: null, name: "", email: "", loginTime: null }),
    }),
    { name: "hackos-auth" },
  ),
);
