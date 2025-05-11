import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

/**
 * Koyu/Açık tema değiştirici buton bileşeni
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-md w-9 h-9 p-2 inline-flex items-center justify-center transition-colors hover:bg-secondary"
      aria-label="Tema değiştir"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Tema değiştir</span>
    </button>
  );
}

/**
 * Genişletilmiş tema değiştirici bileşeni (Açık/Koyu/Sistem)
 */
export function ThemeToggleExtended() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setTheme("light")}
        className={`rounded-md p-2 ${
          theme === "light" ? "bg-accent" : "hover:bg-accent/50"
        } transition-colors`}
        aria-label="Açık tema"
        title="Açık tema"
      >
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Açık tema</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`rounded-md p-2 ${
          theme === "dark" ? "bg-accent" : "hover:bg-accent/50"
        } transition-colors`}
        aria-label="Koyu tema"
        title="Koyu tema"
      >
        <Moon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Koyu tema</span>
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`rounded-md p-2 ${
          theme === "system" ? "bg-accent" : "hover:bg-accent/50"
        } transition-colors`}
        aria-label="Sistem teması"
        title="Sistem teması"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[1.2rem] w-[1.2rem]"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
        <span className="sr-only">Sistem teması</span>
      </button>
    </div>
  );
}