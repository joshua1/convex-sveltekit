import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval("clean demo tasks", { minutes: 5 }, internal.tasks.cleanAndSeed)

export default crons
