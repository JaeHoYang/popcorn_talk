import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { CastMember, CrewMember } from "@/types/detail";
import { posterUrl } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  director: CrewMember | null;
  cast: CastMember[];
}

export default function CastScroll({ director, cast }: Props) {
  const { t } = useLanguage();

  const people = [
    ...(director ? [{ ...director, role: t("감독", "Director"), character: "" }] : []),
    ...cast.map((c) => ({ ...c, role: t("배우", "Actor") })),
  ];

  if (people.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3">{t("감독/출연", "Director & Cast")}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {people.map((person) => (
          <Link
            key={`${person.role}-${person.id}`}
            to={`/person/${person.id}`}
            className="flex flex-col items-center shrink-0 w-20 group"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 mb-2">
              {posterUrl(person.profile_path, "w185") ? (
                <img
                  src={posterUrl(person.profile_path, "w185")!}
                  alt={person.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <User className="w-7 h-7" />
                </div>
              )}
            </div>
            <p className="text-xs font-medium text-slate-200 text-center line-clamp-2 leading-tight">
              {person.name}
            </p>
            <p className="text-xs text-slate-500 text-center line-clamp-1 mt-0.5">
              {person.character || person.role}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
