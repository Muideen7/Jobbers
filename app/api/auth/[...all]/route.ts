// app/api/auth/[...all]/route.ts – Better Auth catch‑all route
import { handlers } from "@/lib/betterAuth";

export const { GET, POST } = handlers;
