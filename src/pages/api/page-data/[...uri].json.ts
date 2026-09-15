import type { Block } from "@wp-block-tools/styles";
import type { APIRoute } from "astro";

type Seo = { metaDesc: string; title: string };
type UriNodes = { nodes: { uri: string }[] };
type AllPagesResult = { data: { pages: UriNodes; projects: UriNodes } };
type PageResult = {
  data: { nodeByUri: { id: string; blocks: Block[]; seo: Seo } | null };
};

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

export async function getStaticPaths() {
  const response = await fetch(`${import.meta.env.WPGRAPHQL_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
		query AllPagesQuery {
			pages(first: 10000){
				nodes {
					uri
					blocks(attributes: false)
				}
			}
			projects(first: 10000){
				nodes {
					uri
					blocks(attributes: false)
				}
			}
		}
  `,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `WPGraphQL request failed: ${response.status} ${await response.text()}`,
    );
  }
  const { data } = (await response.json()) as AllPagesResult;
  return [...data.pages.nodes, ...data.projects.nodes]
    .filter((page: any) => {
      let found = false;
      const hasPropertySearch = (blocks: Block[]) => {
        for (let block of blocks) {
          if (block.name === "regista-hp/project-search") {
            found = true;
            break;
          }
          if (block.innerBlocks) {
            hasPropertySearch(block.innerBlocks);
          }
        }
      };
      hasPropertySearch(page.blocks);
      return !found;
    })
    .map((page) => ({
      params: {
        uri:
          page.uri === "/"
            ? undefined
            : page.uri.substring(1, page.uri.length - 1), // Strip leading end ending slash
      },
    }));
}
