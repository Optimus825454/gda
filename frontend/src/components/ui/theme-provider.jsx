import React, { createContext, useContext, useEffect, useState } from "react";

// Tema context'ini oluştur
const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
});

// Tema sağlayıcısı bileşeni
export function ThemeProvider({
  children,
  defaultTheme = "dark", // "system" yerine "dark" olarak değiştirildi
  storageKey = "hayvancılık-yönetim-tema",
}) {
  // Yerel depolamadan temayı al veya varsayılan tema kullan
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(storageKey);
    return storedTheme || defaultTheme;
  });

  // Tema değiştiğinde etkileri uygula
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Önceki tema sınıflarını temizle
    root.classList.remove("light", "dark");

    // Sistem teması kontrolü
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    // Seçilen temayı uygula
    root.classList.add(theme);
    
    // Tema değişikliğini yerel depolamaya kaydet
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  // Sistem teması değişimlerini dinle
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Sistem teması değiştiğinde tetiklenen işlev
    const onMediaChange = () => {
      if (theme === "system") {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(mediaQuery.matches ? "dark" : "light");
      }
    };
    
    // Medya sorgusu değişikliklerini dinle
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener("change", onMediaChange);
    } else {
      // Eski tarayıcılar için destek
      mediaQuery.addListener(onMediaChange);
    }
    
    // Component kaldırıldığında event listener'ı temizle
    return () => {
      if (mediaQuery?.removeEventListener) {
        mediaQuery.removeEventListener("change", onMediaChange);
      } else {
        // Eski tarayıcılar için destek
        mediaQuery.removeListener(onMediaChange);
      }
    };
  }, [theme]);

  // Value objesi
  const value = {
    theme,
    setTheme: (newTheme) => setTheme(newTheme),
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Tema hook'u
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme hook, ThemeProvider içinde kullanılmalıdır");
  }
  return context;
};