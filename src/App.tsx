import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import Home from "@/pages/Home";
import MovieDetail from "@/pages/MovieDetail";
import PersonDetail from "@/pages/PersonDetail";
import Notices from "@/pages/Notices";
import About from "@/pages/About";
import Boxoffice from "@/pages/Boxoffice";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";
import AnimeAbout from "@/pages/AnimeAbout";
import AnimeHome from "@/pages/AnimeHome";
import AnimeDetail from "@/pages/AnimeDetail";
import AnimeSearch from "@/pages/AnimeSearch";
import AnimeRanking from "@/pages/AnimeRanking";
import AnimeGenre from "@/pages/AnimeGenre";
import DramaHome from "@/pages/DramaHome";
import DramaSearch from "@/pages/DramaSearch";
import DramaRanking from "@/pages/DramaRanking";
import DramaDetail from "@/pages/DramaDetail";
import DramaAbout from "@/pages/DramaAbout";
import MoviesPopular from "@/pages/MoviesPopular";
import MoviesGenre from "@/pages/MoviesGenre";
import WebtoonHome from "@/pages/WebtoonHome";
import WebtoonRanking from "@/pages/WebtoonRanking";
import WebtoonSearch from "@/pages/WebtoonSearch";
import WebtoonGenre from "@/pages/WebtoonGenre";
import WebtoonDetail from "@/pages/WebtoonDetail";
import WebtoonAbout from "@/pages/WebtoonAbout";
import Board from "@/pages/Board";
import BoardPostDetail from "@/pages/BoardPostDetail";
import { useLogEvent } from "@/hooks/useLogEvent";

function PageViewLogger() {
  const location = useLocation();
  const { logPage } = useLogEvent();
  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      logPage(location.pathname);
    }
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <PageViewLogger />
            <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/"            element={<Home />} />
                  <Route path="/movie/:id"   element={<MovieDetail />} />
                  <Route path="/person/:id"  element={<PersonDetail />} />
                  <Route path="/notices"     element={<Notices />} />
                  <Route path="/about"       element={<About />} />
                  <Route path="/boxoffice"      element={<Boxoffice />} />
                  <Route path="/movies/popular" element={<MoviesPopular />} />
                  <Route path="/movies/genre"   element={<MoviesGenre />} />
                  <Route path="/drama"          element={<DramaHome />} />
                  <Route path="/drama/ranking" element={<DramaRanking />} />
                  <Route path="/drama/search"  element={<DramaSearch />} />
                  <Route path="/drama/about"   element={<DramaAbout />} />
                  <Route path="/drama/notices" element={<Notices />} />
                  <Route path="/drama/board"   element={<Board />} />
                  <Route path="/drama/board/:id" element={<BoardPostDetail />} />
                  <Route
                    path="/drama/admin"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/drama/:id"     element={<DramaDetail />} />
                  <Route path="/anime"          element={<AnimeHome />} />
                  <Route path="/anime/ranking"  element={<AnimeRanking />} />
                  <Route path="/anime/search"   element={<AnimeSearch />} />
                  <Route path="/anime/genre"    element={<AnimeGenre />} />
                  <Route path="/anime/notices"  element={<Notices />} />
                  <Route path="/anime/about"    element={<AnimeAbout />} />
                  <Route
                    path="/anime/admin"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/anime/:id"         element={<AnimeDetail />} />
                  <Route path="/webtoon"           element={<WebtoonHome />} />
                  <Route path="/webtoon/ranking"   element={<WebtoonRanking />} />
                  <Route path="/webtoon/search"    element={<WebtoonSearch />} />
                  <Route path="/webtoon/genre"     element={<WebtoonGenre />} />
                  <Route path="/webtoon/about"     element={<WebtoonAbout />} />
                  <Route path="/webtoon/notices"   element={<Notices />} />
                  <Route
                    path="/webtoon/admin"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/webtoon/:id"       element={<WebtoonDetail />} />
                  <Route path="/board"              element={<Board />} />
                  <Route path="/board/:id"          element={<BoardPostDetail />} />
                  <Route path="/anime/board"        element={<Board />} />
                  <Route path="/anime/board/:id"    element={<BoardPostDetail />} />
                  <Route path="/webtoon/board"      element={<Board />} />
                  <Route path="/webtoon/board/:id"  element={<BoardPostDetail />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
