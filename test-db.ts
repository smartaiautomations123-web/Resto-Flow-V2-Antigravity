import "dotenv/config";
import { appRouter } from "./server/routers";
import { createContext } from "./server/_core/context";

async function test() {
    try {
        const req = { path: "/test", header: () => null } as any;
        const res = { setHeader: () => { } } as any;
        const ctx = await createContext({ req, res } as any);
        ctx.user = { id: 1, role: "admin", openId: "test" } as any;
        const caller = appRouter.createCaller(ctx);
        console.log("Calling ordersByType...");
        const result = await caller.reports.ordersByType({ dateFrom: "2026-02-27", dateTo: "2026-03-06" });
        console.log("Success:", result.length);
    } catch (err: any) {
        console.error("TRPC Error:", err);
        if (err.cause) console.error("Cause:", err.cause);
    }
    process.exit();
}
test();
