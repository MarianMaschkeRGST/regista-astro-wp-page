import { Fragment } from "react";
import type { Reading } from "../../pages/api/regista-for-you/_schema";

/**
 * The AI's axis reading, for the development toast. It includes `drive`,
 * which is never shown to visitors.
 */
export function ReadingBreakdown({ reading }: { reading: Reading }) {
  return (
    <div className="mt-1 border-t border-border pt-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Reading</span>
      <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3">
        {Object.entries(reading).map(([axis, value]) => (
          <Fragment key={axis}>
            <dt>{axis}</dt>
            <dd className="text-right">{value ?? "—"}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
