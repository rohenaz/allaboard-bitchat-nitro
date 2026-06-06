import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Best-effort transactional email via the Resend API. No-ops without
// RESEND_API_KEY (so the waitlist works before email is configured).
async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const from = process.env.EMAIL_FROM ?? "BitChat <noreply@bitchatnitro.com>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (err) {
    console.error("[emails] send failed:", err);
  }
}

export const sendWaitlistConfirmation = internalAction({
  args: {
    email: v.string(),
    position: v.optional(v.number()),
    total: v.optional(v.number()),
  },
  handler: async (_ctx, { email, position, total }) => {
    const place = position
      ? `<p>You're <strong>#${position}</strong>${total ? ` of ${total}` : ""} in line.</p>`
      : "";
    await send(
      email,
      "You're on the BitChat waitlist",
      `<h2>You're on the waitlist</h2>${place}<p>We'll email you the moment it's your turn.</p>`,
    );
  },
});

export const sendInvite = internalAction({
  args: { email: v.string() },
  handler: async (_ctx, { email }) => {
    await send(
      email,
      "You're in — welcome to BitChat",
      `<h2>You're in.</h2><p>Your spot on BitChat is ready. Sign in at <a href="https://bitchatnitro.com/login">bitchatnitro.com</a>.</p>`,
    );
  },
});
