import { Movie } from "@/types/movie";
import MovieCard from "@/components/movie/MovieCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  movies: Movie[];
}

export default function SimilarMovies({ movies }: Props) {
  const { t } = useLanguage();
  if (movies.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3">
        {t("이런 영화는 어떠세요?", "You Might Also Like")}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {movies.slice(0, 6).map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
