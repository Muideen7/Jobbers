import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { sendJobbersEmail } from "@/lib/mail";

const welcomeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = welcomeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email payload" },
        { status: 400 },
      );
    }

    const { email, name } = parsed.data;
    const siteUrl = (
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
    ).replace(/\/$/, "");

    await sendJobbersEmail({
      to: email,
      subject: "Welcome to Jobbers! Your AI-powered job search begins",
      heading: `Welcome to Jobbers, ${name || "Job Hunter"}!`,
      bodyText:
        "Your account is ready. Discover tailored jobs across 10+ platforms, track your applications in real-time, and generate ATS-optimized resumes in 1 click.",
      ctaLabel: "Launch Dashboard",
      ctaUrl: `${siteUrl}/home`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/email/welcome]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
