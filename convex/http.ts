import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./betterAuth/auth";
import { postCallWebhook } from "./voiceWebhook";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({ handler: postCallWebhook, method: "POST", path: "/elevenlabs/post-call" });

export default http;
