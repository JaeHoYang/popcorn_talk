import { createContext, useContext, useState } from "react";

type Language = "ko" | "en";

interface LanguageContextValue {
  language: Language;
  uiLanguage: string;
  toggleLanguage: () => void;
  t: (ko: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "ko",
  uiLanguage: "ko-KR",
  toggleLanguage: () => {},
  t: (ko) => ko,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language") as Language | null;
    if (saved === "ko" || saved === "en") return saved;
    return navigator.language.startsWith("ko") ? "ko" : "en";
  });

  const toggleLanguage = () => {
    const next: Language = language === "ko" ? "en" : "ko";
    setLanguage(next);
    localStorage.setItem("language", next);
  };

  const t = (ko: string, en: string) => (language === "ko" ? ko : en);
  const uiLanguage = language === "ko" ? "ko-KR" : "en-US";

  return (
    <LanguageContext.Provider value={{ language, uiLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
