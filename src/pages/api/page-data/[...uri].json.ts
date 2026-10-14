import type { Block } from "@wp-block-tools/styles";
import type { APIRoute } from "astro";

type Seo = { metaDesc: string; title: string };
type PageResult = {
  data: { nodeByUri: { id: string; blocks: Block[]; seo: Seo } | null };
};

// Rendered per request, like the page template it mirrors: no build-time
// enumeration of WordPress uris.
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const uri = params.uri;

  const response = await fetch(`${import.meta.env.WPGRAPHQL_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
	query PageQuery($uri : String!) {
		nodeByUri(uri: $uri) {
			... on Page {
				id
				blocks
				seo {
					metaDesc
					title
				}
			}
			... on Project {
				id
				blocks
				seo {
					metaDesc
					title
				}
			}
		}
	}`,
      variables: {
        uri: uri || "/",
      },
    }),
  });
  if (!response.ok) {
    throw new Error(
      `WPGraphQL request failed: ${response.status} ${await response.text()}`,
    );
  }
  const { data } = (await response.json()) as PageResult;
  return new Response(JSON.stringify({ data: data.nodeByUri }));
};
