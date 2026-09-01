/** 한국어 날짜·시간 표시 (예: 2026년 9월 1일 오전 10:30) */
export function formatKoreanDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "-";
  }
}
