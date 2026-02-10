import { Resend } from "resend";
import { clerkClient } from "@clerk/express";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

async function getPrimaryEmailForClerkUser(userId) {
  // Fetch full Clerk user
  const user = await clerkClient.users.getUser(userId); // Clerk Express supports clerkClient.users.getUser() :contentReference[oaicite:1]{index=1}

  // primaryEmailAddress can be an object or sometimes only an id depending on SDK versions/shape.
  // Handle both safely.
  const pea = user?.primaryEmailAddress;

  if (!pea) return null;

  // Case A: object with emailAddress
  if (typeof pea === "object" && pea.emailAddress) return pea.emailAddress;

  // Case B: string id -> fetch EmailAddress object
  if (typeof pea === "string") {
    const emailObj = await clerkClient.emailAddresses.getEmailAddress(pea);
    return emailObj?.emailAddress || null;
  }

  // Case C: object with id
  if (typeof pea === "object" && pea.id) {
    const emailObj = await clerkClient.emailAddresses.getEmailAddress(pea.id);
    return emailObj?.emailAddress || null;
  }

  return null;
}

function otpEmailHtml({ otp, orderId }) {
  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.5">
    <h2>Meals delivery OTP</h2>
    <p>Your delivery OTP for order <b>${orderId}</b> is:</p>
    <p style="font-size:28px;letter-spacing:3px"><b>${otp}</b></p>
    <p>This OTP expires in <b>30 minutes</b> and can be used only once.</p>
    <p>If you didn't place this order, you can ignore this email.</p>
  </div>
  `;
}

export async function sendOrderOtpEmail({ clerkUserId, otp, orderId }) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("Missing RESEND_FROM");

  const to = await getPrimaryEmailForClerkUser(clerkUserId);
  if (!to) {
    const err = new Error("No primary email found for Clerk user");
    err.code = "NO_PRIMARY_EMAIL";
    throw err;
  }

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Meals: Your delivery OTP",
    html: otpEmailHtml({ otp, orderId }),
  });

  if (error) throw new Error(error.message || "Resend send failed");
  return data;
}
