// lib/betterAuth.ts – Better Auth configuration
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { toNextJsHandler } from "better-auth/next-js";

import client from "@/lib/mongodb";
import { sendJobbersEmail } from "@/lib/mail";

const db = client.db(process.env.MONGODB_DB || undefined);

const siteBaseUrl = (
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
).replace(/\/$/, "");

export const auth = betterAuth({
  baseURL: siteBaseUrl,
  database: mongodbAdapter(db, { client }),
  secret: process.env.BETTER_AUTH_SECRET!,
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    async sendResetPassword(data) {
      await sendJobbersEmail({
        to: data.user.email,
        subject: "Reset your Jobbers account password",
        heading: "Password Reset Request",
        bodyText:
          "You requested to reset your Jobbers account password. Click the button below to choose a new password. If you did not request this, you can safely ignore this email.",
        ctaLabel: "Reset Password",
        ctaUrl: data.url,
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user?.id) {
            try {
              const profilesColl = client.db().collection("profiles");
              await profilesColl.updateOne(
                { id: user.id },
                {
                  $setOnInsert: {
                    id: user.id,
                    full_name: user.name || null,
                    email: user.email || null,
                    image: user.image || null,
                    skills: [],
                    industries: [],
                    work_experience: [],
                    job_titles_seeking: [],
                    preferred_locations: [],
                    is_complete: false,
                    last_jobs_visit_at: null,
                    created_at: new Date().toISOString(),
                  },
                  $set: {
                    updated_at: new Date().toISOString(),
                    ...(user.image ? { image: user.image } : {}),
                  },
                },
                { upsert: true },
              );
            } catch (pErr) {
              console.warn("[betterAuth] profile seed warning", pErr);
            }
          }
          if (user?.email) {
            sendJobbersEmail({
              to: user.email,
              subject: "Welcome to Jobbers! Your AI-powered job search begins",
              heading: `Welcome to Jobbers, ${user.name || "Job Hunter"}!`,
              bodyText:
                "Your account is ready. Discover tailored jobs across 10+ platforms, track your applications in real-time, and generate ATS-optimized resumes in 1 click.",
              ctaLabel: "Launch Dashboard",
              ctaUrl: `${siteBaseUrl}/home`,
            }).catch((err) => console.error("[mail] welcome email trigger error", err));
          }
        },
      },
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
});

export const handlers = toNextJsHandler(auth);

