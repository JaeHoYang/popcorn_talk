import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Film, Tv, BookOpen, Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const MOVIE_NAV = [
  { path: "/",          ko: "홈",        en: "Home" },
  { path: "/boxoffice", ko: "박스오피스", en: "Box Office" },
  { path: "/board",     ko: "게시판",    en: "Board" },
  { path: "/about",     ko: "소개",      en: "About" },
  { path: "/admin",     ko: "관리자",    en: "Admin" },
];

const DRAMA_NAV = [
  { path: "/drama",         ko: "홈",     en: "Home" },
  { path: "/drama/ranking", ko: "순위",   en: "Ranking" },
  { path: "/drama/board",   ko: "게시판", en: "Board" },
  { path: "/drama/about",   ko: "소개",   en: "About" },
  { path: "/drama/admin",   ko: "관리자", en: "Admin" },
];

const ANIME_NAV = [
  { path: "/anime",         ko: "홈",       en: "Home" },
  { path: "/anime/ranking", ko: "순위",     en: "Ranking" },
  { path: "/anime/board",   ko: "게시판",   en: "Board" },
  { path: "/anime/about",   ko: "소개",     en: "About" },
  { path: "/anime/admin",   ko: "관리자",   en: "Admin" },
];

const WEBTOON_NAV = [
  { path: "/webtoon",         ko: "홈",       en: "Home" },
  { path: "/webtoon/ranking", ko: "순위",     en: "Ranking" },
  { path: "/webtoon/board",   ko: "게시판",   en: "Board" },
  { path: "/webtoon/about",   ko: "소개",     en: "About" },
  { path: "/webtoon/admin",   ko: "관리자",   en: "Admin" },
];

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const isDrama   = location.pathname.startsWith("/drama");
  const isAnime   = location.pathname.startsWith("/anime");
  const isWebtoon = location.pathname.startsWith("/webtoon");
  const navItems  = isDrama ? DRAMA_NAV : isWebtoon ? WEBTOON_NAV : isAnime ? ANIME_NAV : MOVIE_NAV;

  const logoText  = isDrama ? "SeriesTalk" : isWebtoon ? "Toon Talk" : isAnime ? "Anime Talk" : "Popcorn Talk";
  const logoIcon  = isDrama
    ? <Tv className="w-6 h-6 text-blue-400" />
    : isWebtoon
      ? <BookOpen className="w-6 h-6 text-green-400" />
      : isAnime
        ? <Tv className="w-6 h-6 text-purple-400" />
        : <Film className="w-6 h-6 text-blue-400" />;
  const logoPath  = isDrama ? "/drama" : isWebtoon ? "/webtoon" : isAnime ? "/anime" : "/";

  // 라우트 변경 시 메뉴 닫기
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  function isActive(path: string) {
    if (path === "/" || path === "/anime" || path === "/drama" || path === "/webtoon") return location.pathname === path;
    return location.pathname.startsWith(path);
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* 서비스 탭 */}
        <div className="flex items-center gap-1 pt-2 border-b border-slate-800/50">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
              !isDrama && !isAnime && !isWebtoon
                ? "bg-slate-800 text-white border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Film className="w-4 h-4" />
            {t("영화", "Movies")}
          </Link>
          <Link
            to="/drama"
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
              isDrama
                ? "bg-slate-800 text-white border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Tv className="w-4 h-4" />
            {t("드라마", "Drama")}
          </Link>
          <Link
            to="/anime"
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
              isAnime
                ? "bg-slate-800 text-white border-b-2 border-purple-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Tv className="w-4 h-4" />
            {t("애니", "Anime")}
          </Link>
          <Link
            to="/webtoon"
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
              isWebtoon
                ? "bg-slate-800 text-white border-b-2 border-green-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <BookOpen className="w-4 h-4" />
            {t("웹툰", "Webtoon")}
          </Link>
        </div>

        {/* 메인 헤더 */}
        <div className="h-14 flex items-center justify-between">
          <Link
            to={logoPath}
            className="flex items-center gap-2 font-bold text-xl text-white shrink-0"
          >
            {logoIcon}
            <span>{logoText}</span>
            <span className="text-xs text-slate-500 font-normal hidden sm:inline">v1.4.1</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 mx-4">
            {navItems.map(({ path, ko, en }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap",
                  isActive(path)
                    ? "text-white bg-slate-700"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                {t(ko, en)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {language === "ko" ? "KR" : "EN"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              aria-label={t("테마 전환", "Toggle theme")}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* 모바일 햄버거 버튼 */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              aria-label={t("메뉴", "Menu")}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 py-2">
            {navItems.map(({ path, ko, en }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm transition-colors",
                  isActive(path)
                    ? "text-white bg-slate-800 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                {t(ko, en)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
