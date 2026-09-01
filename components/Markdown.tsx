/**
 * AI 응답(간단한 마크다운)을 표시하기 위한 최소 렌더러.
 * 외부 의존성 없이 제목/목록/굵게/문단만 처리한다.
 */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${index}`} className="font-semibold text-ink-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${index}`}>{part}</span>
    )
  );
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="my-2 list-disc space-y-1 pl-5 text-[14px] leading-6">
        {listBuffer.map((item, i) => (
          <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    const key = `md-${index}`;

    if (/^\s*[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      listBuffer.push(line.replace(/^\s*\d+[.)]\s+/, ""));
      return;
    }

    flushList(`${key}-list`);

    if (line.startsWith("#")) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const content = line.replace(/^#+\s*/, "");
      blocks.push(
        <p
          key={key}
          className={
            level <= 2
              ? "mt-4 text-[15px] font-semibold text-ink-900"
              : "mt-3 text-[14px] font-semibold text-ink-800"
          }
        >
          {renderInline(content, key)}
        </p>
      );
      return;
    }

    if (line.trim() === "") return;

    blocks.push(
      <p key={key} className="my-1.5 text-[14px] leading-6">
        {renderInline(line, key)}
      </p>
    );
  });

  flushList("md-final-list");

  return <div className="text-ink-700">{blocks}</div>;
}
