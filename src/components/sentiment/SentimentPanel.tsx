import { Component, ReactNode } from "react";
import SentimentAnalysis from "./SentimentAnalysis";
import EmptyState from "@/components/common/EmptyState";

interface ErrorBoundaryState { hasError: boolean }

class SentimentErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          type="error"
          title="AI 분석 영역 오류"
          description="페이지의 다른 기능은 정상 동작합니다."
        />
      );
    }
    return this.props.children;
  }
}

interface Props {
  movieId: number | string;
  movieTitle: string;
  type?: "movie" | "anime" | "webtoon";
}

export default function SentimentPanel({ movieId, movieTitle, type = "movie" }: Props) {
  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <SentimentErrorBoundary>
        <SentimentAnalysis movieId={movieId} movieTitle={movieTitle} type={type} />
      </SentimentErrorBoundary>
    </section>
  );
}
