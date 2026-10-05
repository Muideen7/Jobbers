import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

import { AUTH_COOKIE_SETTINGS } from "@/lib/auth-cookies";

export const { POST } = createRefreshAuthRouter(AUTH_COOKIE_SETTINGS);