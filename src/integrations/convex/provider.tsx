import { createLogger } from "#/lib/logger";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;
const logger = createLogger("convex.provider");
if (!CONVEX_URL) {
  logger.error("missing env var", { env: "VITE_CONVEX_URL" });
}
const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>;
}
