export type PeerPresence = {
  studentId: string;
  studentName: string;
  stageKey: string;
  fieldKey: string;
  cursor?: number;
  updatedAt: number;
};

export const PRESENCE_TTL_MS = 8000;

const PEER_COLORS = ["#7c3aed", "#db2777", "#0891b2", "#ca8a04", "#16a34a", "#ea580c"];

export function colorForStudent(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash + studentId.charCodeAt(i) * (i + 1)) % PEER_COLORS.length;
  }
  return PEER_COLORS[hash]!;
}

export function caretLine(text: string, index: number): number {
  return text.slice(0, Math.max(0, index)).split("\n").length - 1;
}

export function prunePeers(peers: Record<string, PeerPresence>, now = Date.now()): Record<string, PeerPresence> {
  const next: Record<string, PeerPresence> = {};
  for (const [id, peer] of Object.entries(peers)) {
    if (now - peer.updatedAt <= PRESENCE_TTL_MS) next[id] = peer;
  }
  return next;
}

export function peersOnField(
  peers: Record<string, PeerPresence>,
  stageKey: string,
  fieldKey: string,
  excludeStudentId?: string
): PeerPresence[] {
  return Object.values(peers)
    .filter(
      (peer) =>
        peer.stageKey === stageKey &&
        peer.fieldKey === fieldKey &&
        peer.studentId !== excludeStudentId
    )
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "ko"));
}
