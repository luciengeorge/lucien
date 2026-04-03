import rag from "@convex-dev/rag/convex.config.js";
import { defineApp } from "convex/server";

import betterAuth from "./betterAuth/convex.config";

const app = defineApp();

app.use(betterAuth);
app.use(rag);

export default app;
