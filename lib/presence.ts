export type PeerPresence = {
  studentId: string;
  studentName: string;
  stageKey: string;
  fieldKey: string;
  fieldLabel?: string;
  cursor?: number;
  updatedAt: number;
};

export type OnlineMember = {
  studentId: string;
  studentName: string;
  updatedAt: number;
};

export type FieldTypist = {
  studentId: string;
  studentName: string;
  stageKey: string;
  fieldKey: string;
  fieldLabel?: string;
  updatedAt: number;
};

export const PRESENCE_TTL_MS = 12000;
export const ONLINE_TTL_MS = 10000;
export const TYPING_TTL_MS = 5000;

const PEER_COLORS = ["#7c3aed", "#db2777", "#0891b2", "#ca8a04", "#16a34a", "#ea580c"];

export function colorForStudent(studentId: string): string {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash + studentId.charCodeAt(i) * (i + 1)) % PEER_COLORS.length;
  }
  return PEER_COLORS[hash]!;
}

export function fieldKeyOf(stageKey: string, fieldKey: string): string {
  return `${stageKey}.${fieldKey}`;
}

export function prunePeers(peers: Record<string, PeerPresence>, now = Date.now()): Record<string, PeerPresence> {
  const next: Record<string, PeerPresence> = {};
  for (const [id, peer] of Object.entries(peers)) {
    if (now - peer.updatedAt <= PRESENCE_TTL_MS) next[id] = peer;
  }
  return next;
}

export function pruneOnline(members: Record<string, OnlineMember>, now = Date.now()): Record<string, OnlineMember> {
  const next: Record<string, OnlineMember> = {};
  for (const [id, member] of Object.entries(members)) {
    if (now - member.updatedAt <= ONLINE_TTL_MS) next[id] = member;
  }
  return next;
}

export function pruneFieldTypists(
  typists: Record<string, FieldTypist>,
  now = Date.now()
): Record<string, FieldTypist> {
  const next: Record<string, FieldTypist> = {};
  for (const [key, typist] of Object.entries(typists)) {
    if (now - typist.updatedAt <= TYPING_TTL_MS) next[key] = typist;
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

/** typists key = `${stageKey}.${fieldKey}.${studentId}` */
export function markFieldTypist(
  typists: Record<string, FieldTypist>,
  stageKey: string,
  fieldKey: string,
  studentId: string,
  studentName: string,
  fieldLabel?: string
): Record<string, FieldTypist> {
  const key = `${fieldKeyOf(stageKey, fieldKey)}.${studentId}`;
  return pruneFieldTypists({
    ...typists,
    [key]: { studentId, studentName, stageKey, fieldKey, fieldLabel, updatedAt: Date.now() },
  });
}

export function typistsForField(
  typists: Record<string, FieldTypist>,
  stageKey: string,
  fieldKey: string,
  excludeStudentId?: string
): FieldTypist[] {
  const prefix = `${fieldKeyOf(stageKey, fieldKey)}.`;
  return Object.entries(typists)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, typist]) => typist)
    .filter((typist) => typist.studentId !== excludeStudentId)
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "ko"));
}
