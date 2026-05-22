import { DRAMA_COUNTRIES, DramaCountry } from "@/types/drama";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  value: DramaCountry;
  onChange: (country: DramaCountry) => void;
}

export default function CountryTabs({ value, onChange }: Props) {
  const { language } = useLanguage();

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DRAMA_COUNTRIES.map((c) => (
        <button
          key={c.code}
          onClick={() => onChange(c.code)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full transition-colors",
            value === c.code
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          )}
        >
          {language === "ko" ? c.ko : c.en}
        </button>
      ))}
    </div>
  );
}
