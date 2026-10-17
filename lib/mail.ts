// lib/mail.ts
import { Resend } from "resend";

export async function sendJobbersEmail({
  to,
  subject,
  heading,
  bodyText,
  ctaLabel,
  ctaUrl,
}: {
  to: string;
  subject: string;
  heading: string;
  bodyText: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[mail] RESEND_API_KEY not set – email not sent");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <h1>${heading}</h1>
    <p>${bodyText}</p>
    <a href="${ctaUrl}" style="display:inline-block;padding:8px 16px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">${ctaLabel}</a>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Jobbers <no-reply@jobbers.com>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("[mail] send error", error);
  }
}
