const REPLICATE_API = "https://api.replicate.com/v1/predictions";

/**
 * Minimal image analysis using Replicate if REPLICATE_API_TOKEN is set.
 * Expects JSON body: { imageUrls: string[], context?: string }
 * Uses "methexis-inc/img2prompt" to generate a textual description per image (free/cheap tier friendly).
 */
export async function POST(req: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return new Response("Image analysis not configured (set REPLICATE_API_TOKEN)", { status: 501 });
    }

    const body = await req.json().catch(() => ({}));
    const { imageUrls = [], context = "" } = body ?? {};
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response("imageUrls[] is required", { status: 400 });
    }

    const outputs: Array<{ url: string; description: string | null }> = [];

    for (const url of imageUrls) {
      const resp = await fetch(REPLICATE_API, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          version: "21ed7b6e76b2bdc3c7ebd6b246c9181d8e4da2982cd870be51bfc2d53da95e97", // methexis-inc/img2prompt
          input: { image: url }
        })
      });

      if (!resp.ok) {
        const txt = await resp.text();
        outputs.push({ url, description: `error: ${resp.status} ${txt}` });
        continue;
      }

      const json = await resp.json();
      const id = json?.id;

      // poll until completed or failed
      let status = json?.status;
      let result: any = json;
      for (let i = 0; i < 30 && status && status !== "succeeded" && status !== "failed" && status !== "canceled"; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const check = await fetch(`${REPLICATE_API}/${id}`, {
          headers: { Authorization: `Token ${token}` }
        });
        result = await check.json();
        status = result?.status;
      }

      if (status !== "succeeded") {
        outputs.push({ url, description: `status: ${status || "unknown"}` });
      } else {
        const description = Array.isArray(result?.output) ? String(result.output[0] ?? "") : String(result?.output ?? "");
        outputs.push({ url, description });
      }
    }

    return Response.json({ context, outputs });
  } catch (e: any) {
    return new Response(`error: ${e?.message || "unknown"}`, { status: 500 });
  }
}