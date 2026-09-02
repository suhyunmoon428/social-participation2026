const MIRROR_PROPS = [
  "direction",
  "boxSizing",
  "width",
  "height",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export type CaretPoint = {
  top: number;
  left: number;
  height: number;
};

/** textarea 내 커서의 픽셀 좌표 (스크롤 반영) */
export function getTextareaCaretPoint(
  element: HTMLTextAreaElement,
  position: number
): CaretPoint {
  const computed = window.getComputedStyle(element);
  const mirror = document.createElement("div");
  const style = mirror.style;

  style.position = "absolute";
  style.visibility = "hidden";
  style.whiteSpace = "pre-wrap";
  style.wordWrap = "break-word";
  style.overflow = "hidden";

  for (const prop of MIRROR_PROPS) {
    style.setProperty(prop, computed.getPropertyValue(prop));
  }

  style.width = `${element.clientWidth}px`;

  const safePos = Math.max(0, Math.min(position, element.value.length));
  const before = element.value.slice(0, safePos);
  const after = element.value.slice(safePos) || "\u200b";

  mirror.textContent = before;
  const marker = document.createElement("span");
  marker.textContent = after;
  mirror.appendChild(marker);

  document.body.appendChild(mirror);

  const lineHeight = Number.parseFloat(computed.lineHeight) || 21;
  const point = {
    top: marker.offsetTop - element.scrollTop,
    left: marker.offsetLeft - element.scrollLeft,
    height: lineHeight,
  };

  document.body.removeChild(mirror);
  return point;
}
