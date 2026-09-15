import { restRoot } from "./wordpress";

const WP_ROOT = import.meta.env.WORDPRESS_API_ROOT_URL;

/**
 * Matches the body accepted by the mu-plugin `regista-query-log.php`.
 * Optional fields are omitted when the request failed before they were known,
 * so WordPress can tell "failed" apart from "empty".
 */
export type QueryLogEntry = {
  text: string;
  question?: string;
  reframe?: string;
  /** WordPress post ids of the suggested beliefs. */
  beliefIds?: number[];
  costUsd?: number;
};

/** WordPress is slower than the rephrase itself; a hung write must not hold
 *  the Worker open. */
const TIMEOUT_MS = 3000;

/**
 * Records one submitted query on the WordPress backend.
 * Callers run this inside `waitUntil` and log its errors rather than
 * surfacing them: a failed write must never affect the response.
 */
export async function logQuery(entry: QueryLogEntry) {
  // A Worker secret: read at runtime, never inlined into the bundle.
  const secret = process.env.QUERY_LOG_SECRET;
  if (!WP_ROOT) throw new Error("WORDPRESS_API_ROOT_URL is not set");
  if (!secret) throw new Error("QUERY_LOG_SECRET is not set");

  const url = new URL("regista/v1/query-log", restRoot(WP_ROOT));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-query-log-secret": secret,
    },
    body: JSON.stringify(entry),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Query log responded ${response.status}`);
  }
}
