import { Tv } from "lucide-react";
import { WatchProviders } from "@/types/detail";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_BASE = "https://image.tmdb.org/t/p/w92";

interface Props {
  providers: WatchProviders | null;
  isNowPlaying: boolean;
  movieTitle: string;
}

function ProviderGroup({
  label,
  items,
}: {
  label: string;
  items: WatchProviders["flatrate"];
}) {
  if (!items?.length) return null;
  return (
    <div className="mb-3">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((p) => (
          <div key={p.provider_id} className="relative group">
            <img
              src={`${LOGO_BASE}${p.logo_path}`}
              alt={p.provider_name}
              title={p.provider_name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const THEATER_LINKS = [
  { name: "CGV",       url: "https://www.cgv.co.kr" },
  { name: "롯데시네마", url: "https://www.lottecinema.co.kr" },
  { name: "메가박스",  url: "https://www.megabox.co.kr" },
];

export default function WatchProviderSection({ providers, isNowPlaying, movieTitle }: Props) {
  const { t } = useLanguage();
  const hasProviders = providers?.flatrate?.length || providers?.buy?.length || providers?.rent?.length;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
        <Tv className="w-5 h-5 text-blue-400" />
        {t("어디서 볼 수 있나요?", "Where to Watch?")}
      </h2>

      {isNowPlaying && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400 font-medium mb-2">
            🎬 {t("현재 극장 상영중", "Now Playing in Theaters")}
          </p>
          <div className="flex flex-wrap gap-2">
            {THEATER_LINKS.map(({ name, url }) => (
              <a
                key={name}
                href={`${url}/search?query=${encodeURIComponent(movieTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      )}

      {hasProviders ? (
        <>
          <ProviderGroup label={t("스트리밍", "Streaming")} items={providers?.flatrate} />
          <ProviderGroup label={t("구매", "Buy")} items={providers?.buy} />
          <ProviderGroup label={t("렌탈", "Rent")} items={providers?.rent} />
        </>
      ) : (
        <p className="text-sm text-slate-500">{t("현재 스트리밍 서비스 정보 없음", "No streaming info available")}</p>
      )}
    </section>
  );
}
