export async function POST() {
  // Image analysis is not implemented in this free serverless plan.
  // You can integrate a third-party vision API (e.g., Replicate, OpenAI, or external services),
  // then stream or return structured findings here.
  return new Response("Not implemented on free plan", { status: 501 });
}