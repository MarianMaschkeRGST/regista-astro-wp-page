import { useState } from "react";
import {
  MAX_TEXT_LENGTH,
  type Rephrasing,
  type Results,
} from "../../pages/api/regista-for-you/_schema.ts";
import { Toaster, toast } from "../ui/toast.tsx";
import AiLabel from "./ai-label.tsx";
import StepPosts from "./steps/step-posts.tsx";

type Step = "input" | "loading" | "confirm" | "posts" | "error";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error((payload as { error?: string }).error ?? "Request failed.");
  }
  return payload as T;
}

// The toast manager is global, so one Toaster around the flow serves every step.
export default function RegistaForYou() {
  return (
    <Toaster>
      <RegistaForYouFlow />
    </Toaster>
  );
}

function RegistaForYouFlow() {
  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [rephrasing, setRephrasing] = useState<Rephrasing | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState("");
  console.log(rephrasing);
  async function rephrase() {
    setStep("loading");
    try {
      const result = await postJson<Rephrasing>(
        "/api/regista-for-you/rephrase",
        { text },
      );
      setRephrasing(result);
      if (result.calls) {
        toast.add({
          type: "success",
          title: "Usage",
          timeout: 0,
          data: { calls: result.calls },
        });
      }
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("error");
    }
  }

  async function confirm() {
    setStep("loading");
    try {
      setResults(
        await postJson<Results>("/api/regista-for-you/posts", {
          beliefs: rephrasing!.beliefs.map((belief) => belief.id),
        }),
      );
      setStep("posts");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("error");
    }
  }

  function restart() {
    setStep("input");
    setRephrasing(null);
    setResults(null);
    setError("");
  }

  if (step === "loading") {
    return <p className="mx-auto w-md py-12 text-center">One moment…</p>;
  }

  if (step === "error") {
    return (
      <div className="mx-auto w-md py-12 text-center">
        <p className="mb-4">{error}</p>
        <button className="underline" onClick={restart}>
          Start over
        </button>
      </div>
    );
  }

  if (step === "confirm" && rephrasing) {
    return (
      <div className="mx-auto flex w-md flex-col gap-4 py-12">
        <h2 className="text-2xl tracking-[1.3px] uppercase">
          もしかすると、こんな問いでしょうか
        </h2>
        <p className="text-xl">{rephrasing.question}</p>
        <AiLabel />
        <ul className="flex flex-col flex-wrap gap-2">
          <li className="text-lg">レジスタ関連のBelief</li>
          {rephrasing.beliefs.map((belief) => (
            <li
              key={belief.id}
              className="rounded-full border px-3 py-1 text-sm w-fit"
            >
              {belief.title}
            </li>
          ))}
        </ul>
        <div className="flex gap-4">
          <button
            className="bg-blast-off rounded-full px-6 py-3 font-bold tracking-[1.3px] uppercase"
            onClick={confirm}
          >
            この問いで進む
          </button>
          <button className="underline" onClick={() => setStep("input")}>
            書き直す
          </button>
        </div>
      </div>
    );
  }

  if (step === "posts" && rephrasing && results) {
    return (
      <StepPosts
        text={text}
        rephrasing={rephrasing}
        results={results}
        onRestart={restart}
      />
    );
  }

  return (
    <form
      className="mx-auto flex w-md flex-col gap-4 py-12"
      onSubmit={(event) => {
        event.preventDefault();
        rephrase();
      }}
    >
      <label className="text-sm tracking-[1.3px] uppercase" htmlFor="wish">
        あなたはいま、社会や地域や仕事について、何を考えていますか？
      </label>
      <textarea
        id="wish"
        className="border p-3"
        rows={4}
        maxLength={MAX_TEXT_LENGTH}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="自由入力欄"
      />
      <button
        className="bg-blast-off w-fit rounded-full px-6 py-3 font-bold tracking-[1.3px] uppercase disabled:opacity-40"
        type="submit"
        disabled={!text.trim()}
      >
        レジスタと考えてみる
      </button>
    </form>
  );
}
