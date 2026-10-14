import type {
  Rephrasing,
  Results,
} from "../../pages/api/regista-for-you/_schema.ts";

/**
 * The flow outlives a page view. A visitor who opens a project from the
 * results and comes back finds their question and results still there, rather
 * than an empty input box.
 *
 * sessionStorage, not localStorage: the inquiry belongs to this visit. It
 * survives navigation, reloads and the back button, and ends with the tab.
 * Every access is guarded — in a private window or with site data blocked,
 * reads and writes throw, and the flow has to work anyway.
 */
const KEY = "regista-for-you";

/** Only the two steps worth returning to are stored. */
export type SavedFlow =
  | { step: "confirm"; text: string; rephrasing: Rephrasing }
  | { step: "posts"; text: string; rephrasing: Rephrasing; results: Results };

/** Rejects anything an older build, or a half-written entry, may have left. */
function isSaved(value: unknown): value is SavedFlow {
  const saved = value as Partial<SavedFlow> | null;
  if (!saved || typeof saved.text !== "string" || !saved.rephrasing) {
    return false;
  }
  if (saved.step === "confirm") return true;
  return saved.step === "posts" && !!(saved as { results?: Results }).results;
}

export function loadFlow(): SavedFlow | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return isSaved(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveFlow(flow: SavedFlow) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(flow));
  } catch {
    // Out of quota or storage blocked: the flow still works, it just will not
    // come back after navigating away.
  }
}

export function clearFlow() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do: the entry is unreachable either way.
  }
}
