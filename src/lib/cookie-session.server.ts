import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getIronSession } from "iron-session";

function getSessionPassword() {
  const password = process.env.TOAST_SECRET;
  if (!password) {
    throw new Error("TOAST_SECRET must be set");
  }

  return password;
}

interface CookieSession<T> {
  data: Partial<T>;
  update: (data: Partial<T>) => Promise<void>;
  clear: () => Promise<void>;
}

/** Encrypted cookie session. Matches the old Start `useSession`: no expiry, cookie lasts the browser session. */
export async function getCookieSession<T extends object>(name: string): Promise<CookieSession<T>> {
  const session = await getIronSession<T>(
    { read: getCookie, write: setCookie },
    {
      cookieName: name,
      password: getSessionPassword(),
      ttl: 0,
      cookieOptions: {
        httpOnly: true,
        maxAge: undefined,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
  );

  return {
    data: session,
    async update(data: Partial<T>) {
      Object.assign(session, data);
      await session.save();
    },
    async clear() {
      session.destroy();
    },
  };
}
