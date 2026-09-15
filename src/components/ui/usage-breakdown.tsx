import type { LanguageModelUsage } from "ai";
import { calculateCost } from "../../lib/pricing";

/** One model call's accounting. `null` usage means the call never happened. */
export type UsageCall = {
  label: string;
  model: string | null;
  usage: LanguageModelUsage | null;
};

const n = new Intl.NumberFormat("en-US");

function formatCost(usd: number) {
  // Sub-cent calls round to "$0.00" under normal currency formatting,
  // which reads as free. Show real digits below a cent.
  return usd < 0.01
    ? `$${usd.toFixed(6)}`
    : usd.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function Row({
  label,
  value,
  indent,
}: {
  label: string;
  value: string;
  indent?: boolean;
}) {
  return (
    <>
      <dt className={indent ? "pl-3 opacity-70" : undefined}>{label}</dt>
      <dd className="text-right">{value}</dd>
    </>
  );
}

function CallBreakdown({ label, model, usage }: UsageCall) {
  if (!usage || !model) {
    return (
      <div className="border-t border-border pt-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium text-foreground">{label}</span>
          <span className="opacity-70">not run</span>
        </div>
      </div>
    );
  }

  const cost = calculateCost(model, usage);

  return (
    <div className="border-t border-border pt-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-foreground">{label}</span>
        <span className="truncate opacity-70">{model}</span>
      </div>
      <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 tabular-nums">
        <Row label="Input" value={n.format(usage.inputTokens ?? 0)} />
        {cost && cost.cachedInputTokens > 0 && (
          <Row indent label="cached" value={n.format(cost.cachedInputTokens)} />
        )}
        <Row label="Output" value={n.format(usage.outputTokens ?? 0)} />
        {cost && cost.reasoningTokens > 0 && (
          <Row
            indent
            label="reasoning"
            value={n.format(cost.reasoningTokens)}
          />
        )}
        {cost ? (
          <Row label="Cost" value={formatCost(cost.totalCost)} />
        ) : (
          <Row label="Cost" value="no price on file" />
        )}
      </dl>
    </div>
  );
}

export function UsageBreakdown({ calls }: { calls: UsageCall[] }) {
  if (calls.length === 0) return null;

  const priced = calls.flatMap((call) =>
    call.model && call.usage
      ? (calculateCost(call.model, call.usage) ?? [])
      : [],
  );
  const total = priced.reduce((sum, cost) => sum + cost.totalCost, 0);

  return (
    <div className="mt-1 flex flex-col gap-1.5 text-xs text-muted-foreground">
      {calls.map((call) => (
        <CallBreakdown key={call.label} {...call} />
      ))}
      {calls.length > 1 && priced.length > 0 && (
        <div className="flex items-baseline justify-between gap-2 border-t border-border pt-1.5 font-medium text-foreground tabular-nums">
          <span>Total</span>
          <span>{formatCost(total)}</span>
        </div>
      )}
    </div>
  );
}
