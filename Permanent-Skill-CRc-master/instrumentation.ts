export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Gracefully handle serverless process shutdown and net.Server close teardown events in Vercel
    if (typeof process !== "undefined" && typeof process.on === "function") {
      process.on("uncaughtException", (err: any) => {
        if (
          err?.message?.includes("Server is not running") ||
          err?.code === "ERR_SERVER_NOT_RUNNING" ||
          err?.message?.includes("ERR_SERVER_NOT_RUNNING")
        ) {
          // Benign serverless lifecycle teardown in Vercel Node runtime
          return;
        }
        console.error("Uncaught server exception:", err);
      });

      process.on("unhandledRejection", (reason: any) => {
        if (
          reason?.message?.includes("Server is not running") ||
          reason?.code === "ERR_SERVER_NOT_RUNNING" ||
          reason?.message?.includes("ERR_SERVER_NOT_RUNNING")
        ) {
          // Benign serverless lifecycle teardown in Vercel Node runtime
          return;
        }
        console.error("Unhandled server rejection:", reason);
      });
    }
  }
}
