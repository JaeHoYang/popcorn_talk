# Movie Pulse 🎬

영화 · 애니 · 웹툰을 한 곳에서 탐색하고, 박스오피스 순위와 AI 감성 분석까지 제공하는 엔터테인먼트 정보 서비스입니다.

## 주요 기능

### 🎬 영화
- 제목 · 배우 · 감독으로 영화 검색
- 상세 정보 (출연진, OTT 제공 플랫폼, 유사 추천작, 시리즈 컬렉션)
- AI 기반 관람객 리뷰 감성 분석 (Claude API)
- KOBIS 박스오피스: 일별 / 주간 / 월간 포스터 그리드

### ✨ 애니
- 애니 검색 및 인기 순위
- 방영 중 (Airing) 목록
- AI 감성 분석

### 📖 웹툰
- 플랫폼별 인기 웹툰 (네이버, 카카오 등)
- 장르별 탐색
- 상세 정보 및 유사 웹툰 추천

### 💬 게시판
- 영화 · 애니 · 웹툰 전용 게시판
- 닉네임 + 비밀번호 기반 익명 게시 / 댓글
- 관리자 공지 (3개 게시판 동시 등록)

### 📊 관리자
- 방문 통계 (영화 · 애니 · 웹툰 조회수)
- AI 분석 사용량 모니터링
- 공지 작성 및 캐시 초기화

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Edge Functions) |
| AI | Claude API (Anthropic) |
| 외부 API | TMDB (영화), AniList (애니), MangaDex (웹툰), KOBIS (박스오피스) |
| 배포 | Vercel |

---

## 프로젝트 구조

```
lovable/
├── src/
│   ├── pages/          # 라우트 페이지 컴포넌트
│   ├── components/     # 공통 · 도메인별 컴포넌트
│   ├── contexts/       # 언어(i18n), 인증 컨텍스트
│   ├── hooks/          # 커스텀 훅
│   ├── types/          # TypeScript 타입 정의
│   └── lib/            # supabase 클라이언트, 유틸
└── supabase/
    ├── functions/      # Edge Functions (Deno)
    └── migrations/     # DB 스키마 마이그레이션
```

### Edge Functions

| 함수 | 역할 |
|------|------|
| `search-movie` | 제목 · 배우 · 감독 영화 검색 (TMDB) |
| `get-movie-detail` | 영화 상세 정보 |
| `get-person-detail` | 인물 상세 정보 |
| `popular-movies` | 인기 영화 목록 |
| `discover-movies` | 장르별 영화 탐색 |
| `get-boxoffice` | KOBIS 박스오피스 (일별/주간/월간) |
| `search-anime` | 애니 검색 (AniList) |
| `popular-anime` | 인기 애니 |
| `anime-airing` | 방영 중 애니 |
| `get-anime-detail` | 애니 상세 |
| `get-anime-ranking` | 애니 순위 |
| `search-webtoon` | 웹툰 검색 (MangaDex) |
| `popular-webtoons` | 인기 웹툰 |
| `get-webtoon-detail` | 웹툰 상세 |
| `get-webtoon-ranking` | 웹툰 순위 |
| `get-platform-webtoons` | 플랫폼별 웹툰 |
| `analyze-start` | 영화 감성 분석 시작 |
| `analyze-worker` | 감성 분석 워커 (Claude API) |
| `analyze-job-status` | 분석 작업 상태 조회 |
| `analyze-anime-start` | 애니 감성 분석 시작 |
| `analyze-anime-worker` | 애니 감성 분석 워커 |
| `board-api` | 게시판 CRUD (게시글/댓글) |
| `log-event` | 방문/조회 이벤트 기록 |
| `get-analytics` | 관리자 통계 조회 |
| `get-ai-usage` | AI 사용량 조회 |
| `clear-cache` | 캐시 초기화 |

---

## 로컬 개발 환경 설정

### 사전 요구 사항
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Supabase 프로젝트 (또는 로컬 supabase start)

### 설치

```bash
git clone https://github.com/JaeHoYang/popcorn_talk.git
cd popcorn_talk/lovable
npm install
```

### 환경 변수

`src/lib/supabase.ts`에서 Supabase URL과 Anon Key를 설정하거나,  
프로젝트 루트에 `.env` 파일을 생성합니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase Edge Functions에 필요한 환경 변수 (Supabase Dashboard → Settings → Edge Functions):

```
TMDB_API_KEY=
KOBIS_API_KEY=
ANTHROPIC_API_KEY=
BOARD_ADMIN_SECRET=
```

### DB 마이그레이션

```bash
supabase db push --linked
```

### 개발 서버 실행

```bash
npm run dev
```

---

## 다국어 지원

한국어 / 영어 전환을 지원합니다. `LanguageContext`를 통해 전체 UI 텍스트를 관리합니다.

---

## 버전 정책

- **Minor (1.x.0)**: 영화 · 애니 · 웹툰 등 카테고리 단위 기능 추가
- **Patch (1.0.x)**: 버그 수정 및 소규모 개선

현재 버전: **v1.3.0**

---

## 라이선스

This project is for personal/educational use. External API usage is subject to each provider's terms of service (TMDB, AniList, MangaDex, KOBIS, Anthropic).
