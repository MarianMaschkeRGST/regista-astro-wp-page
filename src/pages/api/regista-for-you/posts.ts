import type { APIRoute } from "astro";
import { fetchMethodsAndProjects } from "../../../lib/wordpress";
import { selectPosts } from "./_select";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { beliefs } = await request.json();
    if (!Array.isArray(beliefs) || beliefs.length === 0) {
      return Response.json({ error: "beliefs are required" }, { status: 400 });
    }

    const { methods, projects } = await fetchMethodsAndProjects();

    return Response.json(selectPosts(beliefs.map(String), methods, projects));
  } catch (error) {
    console.error("Error selecting posts:", error);
    return Response.json({ error: "Could not load results" }, { status: 500 });
  }
};
