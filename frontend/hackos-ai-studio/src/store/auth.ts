import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "participant" | "organizer" | null;

type AuthState = {
  role: Role;
  name: string;
  email: string;
  education: string;
  organization: string;
  bio: string;
  age: string;
  profession: string;
  profilePicture: string | null;
  scanCode: string;
  loginTime: number | null;
  login: (role: Exclude<Role, null>, name: string, email: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<{ name: string; education: string; organization: string; bio: string; age: string; profession: string; profilePicture: string | null }>) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      name: "",
      email: "",
      education: "",
      organization: "",
      bio: "",
      age: "",
      profession: "",
      profilePicture: null,
      scanCode: "HACKOS-2026",
      loginTime: null,
      login: (role, name, email) => set({ role, name, email, loginTime: Date.now() }),
      logout: () => set({ role: null, name: "", email: "", education: "", organization: "", bio: "", age: "", profession: "", profilePicture: null, loginTime: null }),
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
    }),
    { name: "hackos-auth" },
  ),
);
