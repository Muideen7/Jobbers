import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import type { Interview } from "@/types";

function formatIcalDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token") || searchParams.get("user_id");

    let userId: string | null = null;

    if (token) {
      userId = token;
    } else {
      const user = await getCurrentUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return new NextResponse("Unauthorized: Missing calendar token or session", {
        status: 401,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isGoogle = /Google-Calendar-Importer/i.test(userAgent);
    const isApple = /MacCalendar|iOS|macOS|CFNetwork|CalendarAgent/i.test(userAgent);
    const isOutlook = /Outlook|Microsoft/i.test(userAgent);

    const clientName = isGoogle
      ? "Google Calendar"
      : isApple
        ? "Apple Calendar"
        : isOutlook
          ? "Microsoft Outlook"
          : userAgent
            ? userAgent.slice(0, 40)
            : "Calendar App";

    const provider = isGoogle ? "google_calendar" : "ical_feed";
    const nowIso = new Date().toISOString();

    getCollection("integrations")
      .then((coll) =>
        coll.updateOne(
          { user_id: userId, provider },
          {
            $set: {
              connected: true,
              last_synced_at: nowIso,
              "metadata.client_name": clientName,
              "metadata.user_agent": userAgent,
              updated_at: nowIso,
            },
            $inc: { sync_count: 1 },
            $setOnInsert: {
              id: randomUUID(),
              user_id: userId,
              provider,
              enabled: true,
              created_at: nowIso,
            },
          },
          { upsert: true },
        ),
      )
      .catch((err) => console.error("[calendar/feed] failed to log sync", err));

    const interviewsColl = await getCollection<Interview>("interviews");
    const interviews = await interviewsColl
      .find({ user_id: userId, status: { $ne: "cancelled" } })
      .sort({ interview_at: 1 })
      .toArray();

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Jobbers//Interviews Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Jobbers Interviews",
      "X-WR-CALDESC:Scheduled job interviews tracked on Jobbers",
      "X-WR-TIMEZONE:UTC",
    ];

    for (const interview of interviews) {
      const startTime = new Date(interview.interview_at);
      const durationMs = (interview.duration_minutes || 45) * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);

      const summary = `${interview.company} - ${interview.role} (${interview.round_type.replace(/_/g, " ")})`;
      const descParts = [
        `Interview with ${interview.company} for ${interview.role}.`,
        `Round: ${interview.round_type.replace(/_/g, " ")}`,
      ];
      if (interview.interviewer_name) {
        descParts.push(`Interviewer: ${interview.interviewer_name}`);
      }
      if (interview.meeting_url) {
        descParts.push(`Meeting Link: ${interview.meeting_url}`);
      }
      if (interview.notes) {
        descParts.push(`Notes: ${interview.notes}`);
      }

      lines.push(
        "BEGIN:VEVENT",
        `UID:${interview.id}@jobbers.io`,
        `DTSTAMP:${formatIcalDate(new Date())}`,
        `DTSTART:${formatIcalDate(startTime)}`,
        `DTEND:${formatIcalDate(endTime)}`,
        `SUMMARY:${escapeIcalText(summary)}`,
        `DESCRIPTION:${escapeIcalText(descParts.join("\n"))}`,
      );

      if (interview.meeting_url) {
        lines.push(`LOCATION:${escapeIcalText(interview.meeting_url)}`);
        lines.push(`URL:${escapeIcalText(interview.meeting_url)}`);
      } else {
        lines.push("LOCATION:Online / Video Call");
      }

      lines.push("STATUS:CONFIRMED", "END:VEVENT");
    }

    lines.push("END:VCALENDAR");

    const icsContent = lines.join("\r\n");

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="jobbers-interviews.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[api/calendar/feed] GET", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

