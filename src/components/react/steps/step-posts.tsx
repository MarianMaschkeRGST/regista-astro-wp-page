import type {
  Post,
  Rephrasing,
  Results,
} from "../../../pages/api/regista-for-you/_schema.ts";
import AiLabel from "../ai-label.tsx";

type Props = {
  text: string;
  rephrasing: Rephrasing;
  results: Results;
  onRestart: () => void;
};

function ProjectList({ projects }: { projects: Post[] }) {
  if (projects.length === 0) {
    return <p>該当するプロジェクトはまだありません。</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {projects.map((project) => (
        <li key={project.id}>
          <a className="underline" href={project.uri}>
            {project.title}
          </a>
          {project.excerpt && <p>{project.excerpt}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function StepPosts({
  text,
  rephrasing,
  results,
  onRestart,
}: Props) {
  return (
    <div className="mx-auto flex flex-col w-lg  gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <h3>01 YOUR QUESTION</h3>
          {/* 入力から読み取った問いを、短く明確に返す。 */}
          <div>
            <p className="text-sm">あなたの言葉：{text}</p>
            <div className="quote">"{rephrasing.question}"</div>
            <AiLabel />
          </div>
        </div>
        <div className="flex gap-4">
          <h3>02 A DIFFERENT VIEW</h3>
          {/* ユーザーがまだ持っていなかった視点・未来像へリフレ ームする。 */}
          <div>
            <div className="quote">"{rephrasing.reframe}"</div>
            <AiLabel />
          </div>
        </div>
        <div className="flex gap-4">
          <h3>03 OUR BELIEF</h3>
          {/* 関連するBELIEFを1～2個提示する。 */}
          <ul className="flex flex-col gap-2">
            {rephrasing.beliefs.map((belief) => (
              <li key={belief.id}>
                <p>{belief.title}</p>
                <p>{belief.concept}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-4">
          <h3>04 HOW CHANGE HAPPENS</h3>
          {/* 関連METHOD、理論、データ、変化のプロセスを提示す る。 */}
          {results.methods.length === 0 ? (
            <p>該当するメソッドはまだありません。</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {/* Methods have no page of their own, so they are not linked. */}
              {results.methods.map((method) => (
                <li key={method.id}>
                  <p>{method.title}</p>
                  {method.excerpt && <p>{method.excerpt}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-4">
          <h3>05 IN THE REAL WORLD METHOD</h3>
          {/* が実際に働いたプロジェクトを2～3件提示す る。 */}
          <ProjectList projects={results.projects} />
        </div>
        <div className="flex gap-4">
          <h3>06 AN UNEXPECTED CONNECTION</h3>
          {/* 一見別領域だが構造が似ている事例を1件出し、セレンデ ィピティをつくる。 */}
          <ProjectList projects={results.unexpected} />
        </div>
        <div className="flex gap-4">
          <h3>07 WHAT CHANGED</h3>
          数字、証言、行動変容、継続的な変化を提示する。
        </div>
        <div className="flex gap-4">
          <h3>08 PEOPLE WITH THE QUESTION</h3>
          同じ問いに向き合うメンバーを表示する。
        </div>
        <div className="flex gap-4">
          <h3>09 FIELD NOTES</h3>
          関連する問い・研究・フィールドノート・対談を提示する。
        </div>
        <div className="flex gap-4">
          <h3>11 INVITATION</h3>
          相談・協業・参加・採用など、文脈に合うCTAへつな ぐ。
        </div>
      </div>
      <button className="self-start underline" onClick={onRestart}>
        やり直したい！
      </button>
    </div>
  );
}
