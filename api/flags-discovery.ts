import { verifyAccess } from "flags";

// Flags Discovery endpoint (served at /.well-known/vercel/flags via a rewrite)
// so the Vercel Flags Explorer + `vercel flags` CLI can see/toggle the flag.
export const GET = async (request: Request) => {
  const access = await verifyAccess(
    request.headers.get("authorization") ?? undefined,
  );
  if (!access) return new Response(null, { status: 401 });

  return Response.json({
    definitions: {
      "waitlist-mode": {
        description:
          "When on, the app is gated behind the waitlist landing; only approved users get in.",
        options: [
          { value: true, label: "On" },
          { value: false, label: "Off" },
        ],
      },
    },
  });
};
