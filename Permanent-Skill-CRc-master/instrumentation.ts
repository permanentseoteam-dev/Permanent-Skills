export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" || typeof window === "undefined") {
    if (typeof process !== "undefined" && typeof process.on === "function") {
      const isBenignShutdown = (err: any) => {
        const msg = String(err?.message || "");
        const code = String(err?.code || "");
        const stack = String(err?.stack || "");
        return (
          msg.includes("Server is not running") ||
          msg.includes("ERR_SERVER_NOT_RUNNING") ||
          stack.includes("Server is not running") ||
          code === "ERR_SERVER_NOT_RUNNING" ||
          code === "ECONNRESET" ||
          code === "EPIPE" ||
          code === "UND_ERR_SOCKET"
        );
      };

      process.on("uncaughtException", (err: any) => {
        if (isBenignShutdown(err)) return;
        console.error("Uncaught server exception:", err);
      });

      process.on("unhandledRejection", (reason: any) => {
        if (isBenignShutdown(reason)) return;
        console.error("Unhandled server rejection:", reason);
      });
    }
  }
}
