import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile";
import { generateJson } from "@/lib/llm";

type RequestBody = {
  company: string;
  role: string;
  contactName?: string;
  scenario: "post_interview_thank_you" | "post_application_followup" | "status_inquiry" | "offer_response";
  notes?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as RequestBody | null;
    if (!body || !body.company || !body.role) {
      return NextResponse.json(
        { success: false, error: "company and role are required" },
        { status: 400 },
      );
    }

    const profile = await getUserProfile(user.id);
    const candidateName = profile?.full_name || user.name || "Candidate";
    const recipient = body.contactName ? body.contactName : "Hiring Team";

    let scenarioContext = "";
    if (body.scenario === "post_interview_thank_you") {
      scenarioContext = "A genuine, memorable thank you email expressing enthusiasm after an interview, briefly reinforcing fit and thanking them for their time.";
    } else if (body.scenario === "post_application_followup") {
      scenarioContext = "A polite, concise follow-up email 5-7 days after submitting an application, reiterating excitement for the role and checking if any additional information is needed.";
    } else if (body.scenario === "status_inquiry") {
      scenarioContext = "A professional check-in inquiring on the interview decision timeline after the promised date has passed.";
    } else if (body.scenario === "offer_response") {
      scenarioContext = "An appreciative response regarding an offer or next steps, maintaining professional warmth.";
    }

    const prompt = `Candidate Name: ${candidateName}
Recipient Name: ${recipient}
Target Company: ${body.company}
Target Role: ${body.role}
Email Scenario: ${scenarioContext}
Additional Notes / Context: ${body.notes || "None provided"}

Generate an email draft in JSON format:
{
  "subject": "Clear, professional email subject line",
  "bodyText": "Complete email body text formatted with paragraphs and candidate sign-off"
}`;

    const draft = (await generateJson({
      system:
        "You are an executive career coach writing high-conversion professional job seeker emails. Write concise, polite, natural, and highly confident communications. Do not use generic corporate clichés or overly formal Victorian language. Return only valid JSON.",
      prompt,
      temperature: 0.6,
      maxOutputTokens: 800,
    })) as { subject: string; bodyText: string };

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error("[api/communications/draft] POST", error);
    return NextResponse.json({ success: false, error: "Failed to generate draft" }, { status: 500 });
  }
}

