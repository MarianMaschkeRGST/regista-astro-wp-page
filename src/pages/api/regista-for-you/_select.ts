// Prefixed with `_` so Astro does not treat this file as a route.
// Pure selection logic, kept free of I/O so it can be tested without WordPress.
import {
  ASK_KEYS,
  type MemberPost,
  type MethodPost,
  type NotePost,
  type ProjectPost,
  type Reading,
  type Results,
} from "./_schema";

export type Method = MethodPost & { beliefIds: string[] };
export type Project = ProjectPost & { methodIds: string[] };
export type Member = MemberPost & {
  /** ACF `handles_ask` keys, i.e. the values of ASK_KEYS. */
  handlesAsk: string[];
  projectIds: string[];
  methodIds: string[];
};
export type Note = NotePost & {
  beliefIds: string[];
  methodIds: string[];
  projectIds: string[];
  /** The members who wrote it. */
  memberIds: string[];
};

/** The model's order per list. Ids may be invalid or ineligible. */
export type Ranking = {
  methods: string[];
  projects: string[];
  unexpected: string[];
  notes: string[];
};

export const EMPTY_RANKING: Ranking = {
  methods: [],
  projects: [],
  unexpected: [],
  notes: [],
};

const shuffle = <T>(items: T[]) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
};

/**
 * Takes the eligible items in the model's order, up to `max`. When the model
 * named fewer than `min` of them, random eligible items fill up to `min`.
 */
function pickRanked<T extends { id: string }>(
  eligible: T[],
  order: string[],
  min: number,
  max: number,
): T[] {
  const byId = new Map(eligible.map((item) => [item.id, item]));
  const chosen = [...new Set(order)]
    .flatMap((id) => byId.get(id) ?? [])
    .slice(0, max);
  if (chosen.length >= min) return chosen;
  const rest = shuffle(eligible.filter((item) => !chosen.includes(item)));
  return [...chosen, ...rest].slice(0, min);
}

/** The model may only choose methods that reach a selected belief. */
export const candidateMethods = (beliefIds: string[], methods: Method[]) =>
  methods.filter((method) =>
    method.beliefIds.some((id) => beliefIds.includes(id)),
  );

/**
 * 08: members who did the work the visitor is being shown, so the section
 * rests on the same relationships as 04 and 05 rather than on a fresh match.
 * Tiers, best first: a chosen project, a chosen method. Within a tier, whoever
 * takes this kind of `ask` comes first, which is the phase the visitor is in.
 */
function pickMembers(
  members: Member[],
  chosenProjectIds: string[],
  chosenMethodIds: string[],
  ask: Reading["ask"],
  max: number,
): Member[] {
  const askKey = ask ? ASK_KEYS[ask] : null;
  const handlesAsk = (member: Member) =>
    askKey !== null && member.handlesAsk.includes(askKey);

  const tiers = [
    members.filter((member) =>
      member.projectIds.some((id) => chosenProjectIds.includes(id)),
    ),
    members.filter((member) =>
      member.methodIds.some((id) => chosenMethodIds.includes(id)),
    ),
    // Nobody worked on what we showed, but somebody takes this conversation.
    members.filter(handlesAsk),
  ];

  const chosen: Member[] = [];
  for (const tier of tiers) {
    const ordered = [
      ...tier.filter(handlesAsk),
      ...tier.filter((member) => !handlesAsk(member)),
    ];
    for (const member of ordered) {
      if (chosen.length >= max) return chosen;
      if (!chosen.includes(member)) chosen.push(member);
    }
  }
  return chosen;
}

const stripMethod = ({ beliefIds, ...method }: Method): MethodPost => method;
const stripProject = ({ methodIds, ...project }: Project): ProjectPost =>
  project;
const stripMember = ({
  handlesAsk,
  projectIds,
  methodIds,
  ...member
}: Member): MemberPost => member;
const stripNote = ({
  beliefIds,
  methodIds,
  projectIds,
  memberIds,
  ...note
}: Note): NotePost => note;

/**
 * Applies the section rules to the model's ranking. The model decides the
 * order; these rules decide what is allowed, so a bad or empty ranking still
 * yields valid sections.
 */
export function resolveSelection(
  beliefIds: string[],
  methods: Method[],
  projects: Project[],
  members: Member[],
  notes: Note[],
  ranking: Ranking,
  ask: Reading["ask"],
): Omit<Results, "calls"> {
  // 04: two methods that reach a selected belief.
  const beliefMethods = candidateMethods(beliefIds, methods);
  const chosenMethods = pickRanked(beliefMethods, ranking.methods, 2, 2);
  const chosenMethodIds = chosenMethods.map((method) => method.id);

  // 05: two to four projects linked to one of those methods.
  const chosenProjects = pickRanked(
    projects.filter((project) =>
      project.methodIds.some((id) => chosenMethodIds.includes(id)),
    ),
    ranking.projects,
    2,
    4,
  );

  // 06: projects from a different field, i.e. sharing no category with 05.
  // Uncategorised projects are left out: their field is unknown. Projects
  // that still reach a selected belief come first (same principle, different
  // field), then any other project from a different field.
  const categories05 = new Set(
    chosenProjects.flatMap((project) => project.categories),
  );
  const beliefMethodIds = beliefMethods.map((method) => method.id);
  const differentField = projects.filter(
    (project) =>
      !chosenProjects.includes(project) &&
      project.categories.length > 0 &&
      project.categories.every((category) => !categories05.has(category)),
  );
  const samePrinciple = differentField.filter((project) =>
    project.methodIds.some((id) => beliefMethodIds.includes(id)),
  );
  const otherPrinciple = differentField.filter(
    (project) => !samePrinciple.includes(project),
  );
  const unexpected: Project[] = [];
  for (const tier of [samePrinciple, otherPrinciple]) {
    const remaining = 2 - unexpected.length;
    if (remaining > 0) {
      unexpected.push(
        ...pickRanked(tier, ranking.unexpected, remaining, remaining),
      );
    }
  }

  // 08: the people behind 04 and 05, at most two so the page stays on action.
  const chosenProjectIds = chosenProjects.map((project) => project.id);
  const chosenMembers = pickMembers(
    members,
    chosenProjectIds,
    chosenMethodIds,
    ask,
    2,
  );

  // 09: notes that reach what the visitor was just shown, through a selected
  // belief, a chosen method or project, or the member who wrote them.
  const chosenMemberIds = chosenMembers.map((member) => member.id);
  const eligibleNotes = notes.filter(
    (note) =>
      note.beliefIds.some((id) => beliefIds.includes(id)) ||
      note.methodIds.some((id) => chosenMethodIds.includes(id)) ||
      note.projectIds.some((id) => chosenProjectIds.includes(id)) ||
      note.memberIds.some((id) => chosenMemberIds.includes(id)),
  );
  const chosenNotes = pickRanked(eligibleNotes, ranking.notes, 1, 2);

  return {
    methods: chosenMethods.map(stripMethod),
    projects: chosenProjects.map(stripProject),
    unexpected: unexpected.map(stripProject),
    members: chosenMembers.map(stripMember),
    notes: chosenNotes.map(stripNote),
  };
}
