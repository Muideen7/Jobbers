import { NextRequest, NextResponse } from "next/server";
import { sendJobbersEmail } from "@/lib/mail";

/**
 * GET or POST /api/email/test?to=youremail@example.com
 * Allows testing Resend email delivery directly.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to");

  if (!to) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing 'to' query parameter. Example: /api/email/test?to=youremail@example.com",
        hasApiKey: Boolean(process.env.RESEND_API_KEY),
        emailFrom: process.env.EMAIL_FROM || "Jobbers <no-reply@jobbers.com>",
      },
      { status: 400 },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "RESEND_API_KEY is not set in environment variables.",
      },
      { status: 500 },
    );
  }

  try {
    await sendJobbersEmail({
      to,
      subject: "Jobbers Test Email: Resend is Connected!",
      heading: "Resend Email Integration Working",
      bodyText: "Your Jobbers Resend email delivery is properly wired in and configured.",
      ctaLabel: "Open Jobbers",
      ctaUrl: `${process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/home`,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
