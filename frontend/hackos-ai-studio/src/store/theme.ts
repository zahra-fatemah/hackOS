import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeState = {
  theme: "dark" | "light";
  toggleTheme: () => void;
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark",
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    { name: "hackos-theme" },
  ),
);
