// Prefixed with `_` so Astro does not treat this file as a route.
// Pure selection logic, kept free of I/O so it can be tested without WordPress.
import type { Post, Results } from "./_schema";

export type Method = Post & { beliefIds: string[] };
export type Project = Post & { methodIds: string[] };

const shuffle = <T>(items: T[]) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
};

const pick = <T>(items: T[], count: number) => shuffle(items).slice(0, count);

const toPost = ({ id, title, uri, excerpt }: Post): Post => ({
  id,
  title,
  uri,
  excerpt,
});

export function selectPosts(
  beliefIds: string[],
  methods: Method[],
  projects: Project[],
): Results {
  // 04: two random methods related to any selected belief.
  const selectedMethods = pick(
    methods.filter((method) =>
      method.beliefIds.some((id) => beliefIds.includes(id)),
    ),
    2,
  );
  const methodIds = selectedMethods.map((method) => method.id);

  // 05: up to four random projects related to any selected method.
  const matchedProjects = pick(
    projects.filter((project) =>
      project.methodIds.some((id) => methodIds.includes(id)),
    ),
    4,
  );

  // 06: two random projects unrelated to the selection. Projects only link to
  // methods, so a project matches a belief through its methods. Every project
  // in 05 carries a selected method, so the two lists never overlap.
  const beliefIdsByMethod = new Map(
    methods.map((method) => [method.id, method.beliefIds]),
  );
  const unexpected = pick(
    projects.filter((project) =>
      project.methodIds.every(
        (id) =>
          !methodIds.includes(id) &&
          !(beliefIdsByMethod.get(id) ?? []).some((beliefId) =>
            beliefIds.includes(beliefId),
          ),
      ),
    ),
    2,
  );

  return {
    methods: selectedMethods.map(toPost),
    projects: matchedProjects.map(toPost),
    unexpected: unexpected.map(toPost),
  };
}
