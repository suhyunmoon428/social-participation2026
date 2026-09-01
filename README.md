# 사회참여활동 워크스페이스

고등학생이 4단계 '사회참여 활동' 프로젝트를 팀으로 수행하는 노션 스타일 협업 웹앱입니다.

- **프론트엔드**: Next.js 14 (App Router) · React 18 · Tailwind CSS
- **백엔드/DB**: Supabase (PostgreSQL, Realtime Broadcast)
- **AI**: OpenRouter API (서버 측 API Route 에서만 호출)
- **배포**: GitHub → Vercel

---

## 1. 시작하기

### 1) Node.js 설치

이 프로젝트는 Node.js 18.18 이상이 필요합니다. 현재 PC에 Node.js가 없다면 먼저 설치하세요.

- 설치 페이지: <https://nodejs.org> (LTS 버전 권장)
- 설치 후 새 터미널에서 확인:

```powershell
node -v
npm -v
```

### 2) 패키지 설치

```powershell
npm install
```

### 3) 환경변수 설정

`.env.local.example` 를 복사해 `.env.local` 을 만들고 값을 채웁니다.

```powershell
Copy-Item .env.local.example .env.local
```

| 변수 | 설명 | 노출 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | 브라우저 노출 OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key (실시간 채널 전용) | 브라우저 노출 OK |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key — 모든 DB 접근에 사용 | **서버 전용** |
| `OPENROUTER_API_KEY` | OpenRouter API 키 | **서버 전용** |
| `OPENROUTER_MODEL` | 사용 모델 (예: `google/gemini-2.0-flash-001`) | 서버 |
| `SESSION_SECRET` | 세션 쿠키 서명용 랜덤 문자열(32자 이상) | **서버 전용** |
| `TEACHER_PASSWORD_HASH` | 교사 대시보드 비밀번호 bcrypt 해시 | **서버 전용** |
| `TEACHER_PASSWORD` | 해시가 없을 때 사용하는 평문(개발용) | **서버 전용** |

> `NEXT_PUBLIC_` 접두어가 붙은 값만 브라우저로 전달됩니다. OpenRouter 키와 service role 키에는 절대 이 접두어를 붙이지 마세요.

교사 비밀번호 해시 생성:

```powershell
node scripts/hash-password.mjs "선생님비밀번호"
```

세션 시크릿 생성(PowerShell):

```powershell
-join ((1..48) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

### 4) Supabase 스키마 적용

Supabase 대시보드 → **SQL Editor** → `supabase/schema.sql` 전체 내용을 붙여넣고 **Run**.

생성되는 객체:

- 테이블: `students`, `teams`, `team_members`, `projects`, `project_edits`, `ai_messages`, `assessments`
- 함수: `generate_join_code()`, `enforce_team_capacity()`, `touch_updated_at()`
- 뷰: `team_progress`
- 모든 테이블에 RLS 활성화 + 클라이언트(anon/authenticated) 접근 전면 차단

### 5) 개발 서버 실행

```powershell
npm run dev
```

- 학생 화면: <http://localhost:3000>
- 교사 대시보드: <http://localhost:3000/teacher>

---

## 2. 인증 구조

Supabase Auth 대신 학교 환경에 맞춘 커스텀 인증을 사용합니다.

1. 학생이 `학년-반-번호-이름` + 개인 비밀번호를 입력합니다.
2. 처음이면 `students` 에 등록되고, 비밀번호는 bcrypt(10 rounds)로 해시되어 저장됩니다.
3. 이후 접속은 같은 정보로 로그인합니다. 세션은 HMAC-SHA256 으로 서명된 `HttpOnly` 쿠키(30일)로 유지되므로 기기를 바꿔도 로그인만 하면 기존 기록을 이어서 작성할 수 있습니다.
4. 교사는 `/teacher` 에서 관리자 비밀번호(해시 검증)로 별도 세션을 받습니다.

**보안 설계**: 브라우저는 DB에 직접 접근하지 않습니다. 모든 읽기·쓰기는 Next.js 서버 라우트가 service role key로 수행하며, RLS는 anon/authenticated 롤을 전면 차단합니다. 실시간 협업은 테이블 구독이 아닌 Supabase **Realtime Broadcast** 채널(`team:{teamId}`)을 사용해 데이터 유출 없이 동작합니다.

---

## 3. 학생 활동 흐름

| 단계 | 내용 |
| --- | --- |
| 1단계 문제 인식 | 문제 발견 · 원인 분석 · 근거 자료 · 역할 분배 |
| 2단계 대안 평가 | 국내 사례 · 국외 사례 · 장단점 비교 · 기존 한계 |
| 3단계 정책 제안 | 정책 제안 · 근거와 기대 효과 · 예상 부작용 · 해결 방안 |
| 4단계 실행 계획 | 실천 활동 · 일정과 역할 · 결과와 성찰 · AI 발표 개요(20매) |

- 좌측: 단계별 목차와 진행률, 팀 정보, 참여 코드
- 중앙: 노션 스타일 서술형 에디터 (입력 후 0.8초 디바운스 자동 저장)
- 우측: AI 논리 조력자 패널

---

## 4. AI 기능

`app/api/ai/route.ts` 한 곳에서 두 역할을 처리합니다.

- `mode: "coach"` — **논리 조력자**. 정답·완성 문장을 주지 않고, 논리적 비약·필요한 통계·예상 부작용·누락된 이해관계자를 질문 형태로 짚어줍니다. 대화는 `ai_messages` 에 단계별로 저장됩니다.
- `mode: "outline"` — **서기/종합**. 1~4단계 기록 전체를 근거로 20매 분량 발표 개요를 생성하고 `projects.ppt_outline` 에 저장합니다. 기록에 없는 내용은 `[팀이 보완할 부분: ...]` 으로 표시합니다.

교사용 과정중심평가 초안은 `app/api/teacher/assessment/route.ts` 에서 생성되며, 팀 기록 + 개인별 기여도 + AI 질문 이력을 함께 참고합니다.

---

## 5. 교사용 대시보드

- 칸반 뷰: 1~4단계 열에 팀 카드를 배치해 전체 진행 현황을 한눈에 확인
- 리스트 뷰: 팀·팀원·현재 단계·단계별 진행률·평가 상태를 표로 확인
- 팀 상세: 단계별 전체 기록, **개인별 작성 기여도(글자수·비율·AI 질문 횟수)**, AI 발표 개요
- 과정중심평가: `AI 평가 초안 생성` → 교사가 직접 수정 → `임시 저장` / `최종 승인 저장`

---

## 6. 에러 처리

모든 API 응답은 `{ ok, data }` 또는 `{ ok: false, message, code }` 형태입니다. 500, RLS 오류 같은 개발자용 정보는 서버 콘솔에만 기록하고, 사용자에게는 "저장하지 못했어요. 잠시 후 다시 시도해 주세요."처럼 학생 친화적인 문구를 토스트로 띄웁니다. 문구는 `lib/messages.ts` 에서 한 곳에서 관리합니다.

---

## 7. Vercel 배포

1. 이 폴더를 GitHub 저장소로 푸시합니다.
2. Vercel → **Add New Project** → 해당 저장소 Import.
3. **Environment Variables** 에 `.env.local` 의 모든 값을 등록합니다. `OPENROUTER_SITE_URL` 은 배포 도메인으로 바꾸세요.
4. Deploy. 프레임워크는 Next.js 로 자동 감지되며 별도 빌드 설정이 필요 없습니다.

---

## 8. 폴더 구조

```
app/
  api/
    ai/route.ts                    OpenRouter 호출 (coach / outline)
    auth/login/route.ts            학생 등록·로그인
    auth/logout/route.ts
    me/route.ts                    세션 + 팀 + 프로젝트 로드
    projects/save/route.ts         자동 저장 + 기여도 로그
    projects/complete/route.ts     프로젝트 제출
    teacher/login/route.ts
    teacher/teams/route.ts         전체 팀 진행 현황
    teacher/teams/[teamId]/route.ts 팀 상세 + 기여도
    teacher/assessment/route.ts    평가 초안 생성 / 저장
  teacher/page.tsx                 교사 대시보드
  page.tsx                         학생 진입점 (로그인 → 팀 → 워크스페이스)
components/
  AiPanel.tsx  LoginForm.tsx  Markdown.tsx  TeamGate.tsx  Toast.tsx  Workspace.tsx
  teacher/TeamDetail.tsx
lib/
  apiResponse.ts  fetcher.ts  messages.ts  openrouter.ts  session.ts
  stages.ts  supabaseAdmin.ts  supabaseBrowser.ts  workspace.ts
supabase/schema.sql                통합 DDL + RLS
scripts/hash-password.mjs          교사 비밀번호 해시 생성
```
