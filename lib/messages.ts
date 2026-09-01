/**
 * 학생 친화적 안내 문구. 개발자용 코드(500, RLS error 등)는 서버 로그에만 남긴다.
 * 서버·클라이언트 양쪽에서 import 하므로 next/server 등 서버 전용 모듈에 의존하지 않는다.
 */
export const FRIENDLY_MESSAGES = {
  SAVE_FAILED: "저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
  LOAD_FAILED: "기록을 불러오지 못했어요. 새로고침을 해볼까요?",
  UNAUTHENTICATED: "먼저 로그인해 주세요.",
  FORBIDDEN: "이 내용을 볼 수 있는 권한이 없어요.",
  INVALID_INPUT: "입력한 내용을 다시 확인해 주세요.",
  INVALID_STUDENT_INFO: "학년은 1~6, 반은 1~30, 번호는 1~60 사이로 입력해 주세요.",
  WRONG_PASSWORD: "비밀번호가 맞지 않아요.",
  DUPLICATE_STUDENT: "이미 등록된 학생이에요. 비밀번호로 로그인해 주세요.",
  TEAM_NOT_FOUND: "참여 코드를 다시 확인해 주세요.",
  TEAM_FULL: "이 팀은 이미 3명이 모두 모였어요.",
  ALREADY_IN_TEAM: "이미 다른 팀에 참여하고 있어요.",
  AI_FAILED: "AI 도우미가 잠시 쉬고 있어요. 조금 뒤에 다시 요청해 주세요.",
  AI_SETUP_FAILED:
    "AI 설정에 문제가 있어요. 선생님께 OpenRouter API 키(.env.local) 설정을 확인해 달라고 요청해 주세요.",
  AI_CREDITS: "AI 사용 한도가 부족해요. 선생님께 OpenRouter 크레딧을 확인해 달라고 요청해 주세요.",
  TEACHER_NOT_CONFIGURED:
    "교사 로그인 설정이 아직 안 되어 있어요. Vercel 환경변수에 TEACHER_PASSWORD를 추가해 주세요.",
  PDF_ONLY: "PDF 파일만 업로드할 수 있어요.",
  FILE_TOO_LARGE: "파일이 너무 커요. 8MB 이하 PDF만 업로드해 주세요.",
  UPLOAD_FAILED: "파일을 업로드하지 못했어요. Supabase Storage 설정을 확인해 주세요.",
  UNKNOWN: "예상하지 못한 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
} as const;

export type FriendlyCode = keyof typeof FRIENDLY_MESSAGES;
