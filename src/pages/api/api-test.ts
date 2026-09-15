export async function GET({ params, request }) {
  return new Response(
    JSON.stringify({
      name: "ASTRO",
      url: "https://astro.build/",
    }),
  );
}
