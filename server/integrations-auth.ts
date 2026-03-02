import { Router } from "express";
import * as db from "./db";

export const integrationsAuthRouter = Router();

// ── Square OAuth ────────────────────────────────────────────────────────────
integrationsAuthRouter.get("/square/callback", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string; // Will contain the user ID for mapping

    if (!code || !state) {
        return res.status(400).send("Missing OAuth code or state parameter.");
    }

    try {
        const userId = parseInt(state, 10);
        if (isNaN(userId)) {
            throw new Error("Invalid state parameter, user ID expected.");
        }

        // In a real implementation we would securely exchange the `code` for an access token:
        // const tokenResponse = await fetch("https://connect.squareup.com/oauth2/token", { ... });
        // const { access_token } = await tokenResponse.json();

        const mockAccessToken = `sq0atp-oauth-${code.substring(0, 10)}-token`;

        await db.createIntegration({
            type: "square",
            name: "Square POS",
            apiKey: mockAccessToken,
            config: JSON.stringify({ locationId: "oauth-default-location", authMethod: "oauth" }),
        });

        // Redirect the user back to the Integrations UI with a success flag
        res.redirect("/integrations?auth_success=square");
    } catch (error) {
        console.error("Square OAuth Error:", error);
        res.redirect("/integrations?auth_error=square");
    }
});

// ── Toast OAuth ─────────────────────────────────────────────────────────────
integrationsAuthRouter.get("/toast/callback", async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
        return res.status(400).send("Missing OAuth code or state parameter.");
    }

    try {
        const userId = parseInt(state, 10);
        if (isNaN(userId)) {
            throw new Error("Invalid state parameter, user ID expected.");
        }

        // Mock token exchange
        const mockAccessToken = `toast-oauth-${code.substring(0, 10)}-token`;

        await db.createIntegration({
            type: "toast",
            name: "Toast POS",
            apiKey: mockAccessToken,
            config: JSON.stringify({ restaurantId: "oauth-default-restaurant", authMethod: "oauth" }),
        });

        res.redirect("/integrations?auth_success=toast");
    } catch (error) {
        console.error("Toast OAuth Error:", error);
        res.redirect("/integrations?auth_error=toast");
    }
});
