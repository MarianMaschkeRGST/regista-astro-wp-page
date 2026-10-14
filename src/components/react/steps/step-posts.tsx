import type {
  ProjectPost,
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

function ProjectList({ projects }: { projects: ProjectPost[] }) {
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
          {project.categories.length > 0 && (
            <ul className="flex flex-wrap gap-1 text-xs">
              {project.categories.map((category) => (
                <li key={category} className="rounded-full border px-2">
                  {category}
                </li>
              ))}
            </ul>
          )}
          {project.summary && <p>{project.summary}</p>}
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
  const changed = results.projects.filter(
    (project) => project.evidence || project.quote,
  );

  return (
    <div className="mx-auto flex flex-col w-4xl  gap-4">
      <div className="flex flex-col gap-8 mt-32">
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">01 YOUR QUESTION</h3>
          {/* 入力から読み取った問いを、短く明確に返す。 */}
          <div className="col-span-3">
            <p className="text-sm">あなたの言葉：{text}</p>
            <div className="quote">"{rephrasing.question}"</div>
            <AiLabel />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">02 A DIFFERENT VIEW</h3>
          {/* ユーザーがまだ持っていなかった視点・未来像へリフレ ームする。 */}
          <div className="col-span-3">
            <div className="quote">"{rephrasing.reframe}"</div>
            <AiLabel />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">03 OUR BELIEF</h3>
          {/* 関連するBELIEFを1～2個提示する。 */}
          <div className="col-span-3">
            <ul className="flex flex-col gap-2">
              {rephrasing.beliefs.map((belief) => (
                <li key={belief.id}>
                  <p>{belief.title}</p>
                  <p>{belief.concept}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">04 HOW CHANGE HAPPENS</h3>
          {/* 関連METHOD、理論、データ、変化のプロセスを提示す る。 */}
          <div className="col-span-3">
            {results.methods.length === 0 ? (
              <p>該当するメソッドはまだありません。</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {/* Methods have no page of their own, so they are not linked. */}
                {results.methods.map((method) => (
                  <li key={method.id}>
                    <p>{method.title}</p>
                    {method.theory && <p>THEORY：{method.theory}</p>}
                    {method.data && <p>DATA：{method.data}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">05 IN THE REAL WORLD METHOD</h3>
          {/* が実際に働いたプロジェクトを2～3件提示す る。 */}
          <div className="col-span-3">
            <ProjectList projects={results.projects} />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">06 AN UNEXPECTED CONNECTION</h3>
          {/* 一見別領域だが構造が似ている事例を1件出し、セレンデ ィピティをつくる。 */}
          <div className="col-span-3">
            <ProjectList projects={results.unexpected} />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">07 WHAT CHANGED</h3>
          {/* 数字、証言、行動変容、継続的な変化を提示する。 */}
          <div className="col-span-3">
            {changed.length === 0 ? (
              <p>変化の記録はまだありません。</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {changed.map((project) => (
                  <li key={project.id}>
                    <p>{project.title}</p>
                    {project.evidence && <p>{project.evidence}</p>}
                    {project.quote && (
                      <blockquote>「{project.quote}」</blockquote>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">08 PEOPLE WITH THE QUESTION</h3>
          {/* 同じ問いに向き合うメンバーを表示する。 */}
          <div className="col-span-3">
            {results.members.length === 0 ? (
              <p>該当するメンバーはまだいません。</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {results.members.map((member) => (
                  <li key={member.id}>
                    <a className="underline" href={member.uri}>
                      {member.title}
                    </a>
                    {member.role && <p className="text-sm">{member.role}</p>}
                    {member.oneLiner && <p>{member.oneLiner}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">09 FIELD NOTES</h3>
          {/* 関連する問い・研究・フィールドノート・対談を提示する。 */}
          <div className="col-span-3">
            {results.notes.length === 0 ? (
              <p>関連するノートはまだありません。</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {results.notes.map((note) => (
                  <li key={note.id}>
                    <a className="underline" href={note.uri}>
                      {note.title}
                    </a>
                    {note.question && <p>{note.question}</p>}
                    {note.nextQuestion && (
                      <p className="text-sm">次の問い：{note.nextQuestion}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* 10 is deliberately not a section: in the flow, the step after the
            field notes is the visitor's own next question, which the やり直したい！
            button below answers better than another block of content would. */}
        <div className="grid grid-cols-5 gap-4">
          <h3 className="col-span-2">11 INVITATION</h3>
          {/* 相談・協業・参加・採用など、文脈に合うCTAへつなぐ。 */}
          <div className="col-span-3">
            <a
              className="bg-blast-off w-fit rounded-full px-6 py-3 font-bold tracking-[1.3px] uppercase"
              href="/contact"
            >
              レジスタに相談する
            </a>
          </div>
        </div>
      </div>
      <button className="self-start underline" onClick={onRestart}>
        やり直したい！
      </button>
    </div>
  );
}
