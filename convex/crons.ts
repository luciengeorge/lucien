import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.weekly("poof-question-digest", { dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 }, internal.digest.run);

export default crons;
