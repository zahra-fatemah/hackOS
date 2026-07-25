import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "participant" | "organizer" | null;

type AuthState = {
  role: Role;
  name: string;
  email: string;
  scanCode: string;
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
      login: (role, name, email) => set({ role, name, email }),
      logout: () => set({ role: null, name: "", email: "" }),
    }),
    { name: "hackos-auth" },
  ),
);
