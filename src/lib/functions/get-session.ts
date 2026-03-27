import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { authClient } from "../auth-client";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  const session = await authClient.getSession({ fetchOptions: { headers } });
  return session.data;
});
