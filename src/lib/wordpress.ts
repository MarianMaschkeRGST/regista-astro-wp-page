import { z } from "zod";
import type { Belief } from "../pages/api/regista-for-you/_schema";
import type {
  Member,
  Method,
  Note,
  Project,
} from "../pages/api/regista-for-you/_select";

const WP_ROOT = import.meta.env.WORDPRESS_API_ROOT_URL;
const GRAPHQL_URL = import.meta.env.WPGRAPHQL_URL;

/**
 * Accepts either the site root or the REST root, with or without a trailing
 * slash, and returns the REST root with one: "https://site.com/wp-json/".
 */
export const restRoot = (root: string) => {
  const trimmed = root.replace(/\/+$/, "");
  return trimmed.endsWith("/wp-json") ? `${trimmed}/` : `${trimmed}/wp-json/`;
};

/**
 * `&amp;` must be decoded last, otherwise `&amp;lt;` double-decodes into `<`.
 */
const decodeEntities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/**
 * Turns a WP `rendered` field into plain text for the model.
 * Tags are stripped before entities are decoded, so encoded markup in the
 * source stays inert text rather than becoming a tag.
 */
const plainText = (html: string, maxLength = 200) => {
  const text = decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};

/** The slice of a WP REST `belief` we actually request via `_fields`. */
const wpBeliefSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.object({ rendered: z.string() }),
  excerpt: z.object({ rendered: z.string() }),
});

export async function fetchBeliefs(): Promise<Belief[]> {
  if (!WP_ROOT) throw new Error("WORDPRESS_API_ROOT_URL is not set");

  const url = new URL("wp/v2/belief", restRoot(WP_ROOT));
  url.searchParams.set("per_page", "100");
  url.searchParams.set("_fields", "id,slug,title,excerpt");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WordPress responded ${response.status}`);
  }

  const beliefs = wpBeliefSchema.array().parse(await response.json());

  return beliefs.map((belief) => ({
    // A string, because z.enum in the rephrase route only accepts strings.
    id: String(belief.id),
    slug: belief.slug,
    title: plainText(belief.title.rendered, 120),
    concept: plainText(belief.excerpt.rendered, 300),
  }));
}

/**
 * The ACF field groups are exposed under `relatedBeliefs` (on Method),
 * `relatedMethod` (on Project) and `memberFields` (on Member). Their names
 * must differ from the post type names: a group named `belief` would collide
 * with the `Belief` GraphQL type. Inside a group, each field carries its own
 * `graphql_field_name`, which is why Member reaches its methods through
 * `memberFields.method` rather than `relatedMethod`, and a Note reaches its
 * projects through `fieldNotesFields.pj`.
 */
const METHODS_AND_PROJECTS_QUERY = `
  query RegistaForYouPosts {
    methods(first: 100) {
      nodes {
        databaseId
        title
        excerpt
        uri
        methodFields {
          theory
          data
        }
        relatedBeliefs {
          belief {
            nodes {
              databaseId
            }
          }
        }
      }
    }
    members(first: 100) {
      nodes {
        databaseId
        title
        excerpt
        uri
        memberFields {
          role
          one_liner
          handlesAsk
          relatedProject {
            nodes {
              databaseId
            }
          }
          method {
            nodes {
              databaseId
            }
          }
        }
      }
    }
    notes(first: 100) {
      nodes {
        databaseId
        title
        excerpt
        uri
        fieldNotesFields {
          question
          nextQuestion
          relatedBelief {
            nodes {
              databaseId
            }
          }
          relatedMethod {
            nodes {
              databaseId
            }
          }
          pj {
            nodes {
              databaseId
            }
          }
          relatedMember {
            nodes {
              databaseId
            }
          }
        }
      }
    }
    projects(first: 100) {
      nodes {
        databaseId
        title
        excerpt
        uri
        contentFields {
          summary
          evidence
          quote
        }
        projectCategories {
          nodes {
            name
          }
        }
        relatedMethod {
          method {
            nodes {
              databaseId
            }
          }
        }
      }
    }
  }
`;

/** An ACF relationship: null when the field is empty. */
const relationSchema = z
  .object({ nodes: z.array(z.object({ databaseId: z.number() })) })
  .nullable();

const gqlPostFields = {
  databaseId: z.number(),
  title: z.string().nullable(),
  excerpt: z.string().nullable(),
  uri: z.string().nullable(),
};

const methodsAndProjectsSchema = z.object({
  methods: z.object({
    nodes: z.array(
      z.object({
        ...gqlPostFields,
        methodFields: z
          .object({
            theory: z.string().nullable(),
            data: z.string().nullable(),
          })
          .nullable(),
        relatedBeliefs: z.object({ belief: relationSchema }).nullable(),
      }),
    ),
  }),
  members: z.object({
    nodes: z.array(
      z.object({
        ...gqlPostFields,
        memberFields: z
          .object({
            role: z.string().nullable(),
            one_liner: z.string().nullable(),
            handlesAsk: z.array(z.string()).nullable(),
            relatedProject: relationSchema,
            method: relationSchema,
          })
          .nullable(),
      }),
    ),
  }),
  notes: z.object({
    nodes: z.array(
      z.object({
        ...gqlPostFields,
        fieldNotesFields: z
          .object({
            question: z.string().nullable(),
            nextQuestion: z.string().nullable(),
            relatedBelief: relationSchema,
            relatedMethod: relationSchema,
            pj: relationSchema,
            relatedMember: relationSchema,
          })
          .nullable(),
      }),
    ),
  }),
  projects: z.object({
    nodes: z.array(
      z.object({
        ...gqlPostFields,
        contentFields: z
          .object({
            summary: z.string().nullable(),
            evidence: z.string().nullable(),
            quote: z.string().nullable(),
          })
          .nullable(),
        projectCategories: z
          .object({ nodes: z.array(z.object({ name: z.string() })) })
          .nullable(),
        relatedMethod: z.object({ method: relationSchema }).nullable(),
      }),
    ),
  }),
});

const toPost = (node: {
  databaseId: number;
  title: string | null;
  excerpt: string | null;
  uri: string | null;
}) => ({
  id: String(node.databaseId),
  title: plainText(node.title ?? "", 120),
  uri: node.uri ?? "",
  excerpt: plainText(node.excerpt ?? "", 200),
});

const relatedIds = (relation: z.infer<typeof relationSchema>) =>
  (relation?.nodes ?? []).map((node) => String(node.databaseId));

export async function fetchSelectableContent(): Promise<{
  methods: Method[];
  projects: Project[];
  members: Member[];
  notes: Note[];
}> {
  if (!GRAPHQL_URL) throw new Error("WPGRAPHQL_URL is not set");

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: METHODS_AND_PROJECTS_QUERY }),
  });
  if (!response.ok) {
    throw new Error(`WPGraphQL responded ${response.status}`);
  }

  // WPGraphQL answers schema errors with a 200 and an `errors` array.
  const payload = (await response.json()) as {
    data?: unknown;
    errors?: { message: string }[];
  };
  if (payload.errors?.length) {
    throw new Error(
      `WPGraphQL errors: ${payload.errors.map((e) => e.message).join("; ")}`,
    );
  }

  const data = methodsAndProjectsSchema.parse(payload.data);

  return {
    methods: data.methods.nodes.map((node) => ({
      ...toPost(node),
      theory: plainText(node.methodFields?.theory ?? "", 600),
      data: plainText(node.methodFields?.data ?? "", 600),
      beliefIds: relatedIds(node.relatedBeliefs?.belief ?? null),
    })),
    projects: data.projects.nodes.map((node) => ({
      ...toPost(node),
      categories: (node.projectCategories?.nodes ?? []).map((term) =>
        plainText(term.name, 60),
      ),
      summary: plainText(node.contentFields?.summary ?? "", 400),
      evidence: plainText(node.contentFields?.evidence ?? "", 600),
      quote: plainText(node.contentFields?.quote ?? "", 300),
      methodIds: relatedIds(node.relatedMethod?.method ?? null),
    })),
    members: data.members.nodes.map((node) => ({
      ...toPost(node),
      role: plainText(node.memberFields?.role ?? "", 120),
      oneLiner: plainText(node.memberFields?.one_liner ?? "", 200),
      handlesAsk: node.memberFields?.handlesAsk ?? [],
      projectIds: relatedIds(node.memberFields?.relatedProject ?? null),
      methodIds: relatedIds(node.memberFields?.method ?? null),
    })),
    notes: data.notes.nodes.map((node) => ({
      ...toPost(node),
      question: plainText(node.fieldNotesFields?.question ?? "", 300),
      nextQuestion: plainText(node.fieldNotesFields?.nextQuestion ?? "", 300),
      beliefIds: relatedIds(node.fieldNotesFields?.relatedBelief ?? null),
      methodIds: relatedIds(node.fieldNotesFields?.relatedMethod ?? null),
      projectIds: relatedIds(node.fieldNotesFields?.pj ?? null),
      memberIds: relatedIds(node.fieldNotesFields?.relatedMember ?? null),
    })),
  };
}
