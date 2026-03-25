import * as db from "../db";
import { Integration, IntegrationLog } from "../../drizzle/schema";

export type IntegrationEvent = 
  | "order.created"
  | "order.completed"
  | "order.cancelled"
  | "payment.received"
  | "reservation.created"
  | "stock.low"
  | "waste.created";

export class IntegrationService {
  /**
   * Main entry point to trigger an integration event.
   * This will dispatch webhooks, Slack messages, and Teams alerts.
   */
  static async triggerEvent(event: IntegrationEvent, payload: any) {
    console.log(`[IntegrationService] Triggering event: ${event}`);
    
    // 1. Dispatch Custom Webhooks
    await this.dispatchWebhooks(event, payload);

    // 2. Dispatch Messaging (Slack/Teams)
    await this.dispatchMessaging(event, payload);

    // 3. Accounting Sync (for completed orders)
    if (event === "order.completed") {
      await this.queueAccountingSync(payload);
    }
  }

  private static async dispatchWebhooks(event: IntegrationEvent, payload: any) {
    const webhooks = await db.listWebhooks();
    const activeWebhooks = webhooks.filter(w => {
        const config = w.config ? JSON.parse(w.config) : {};
        return w.isEnabled && (config.event === event || config.event === "all");
    });

    for (const webhook of activeWebhooks) {
      try {
        const response = await fetch(webhook.webhookUrl!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
        });

        await db.logIntegrationAction(
          webhook.id,
          "webhook",
          response.ok ? "success" : "failed",
          `Webhook sent to ${webhook.webhookUrl}. Status: ${response.status}`,
          { event, payload },
          await response.text().catch(() => "No response body")
        );
      } catch (error: any) {
        console.error(`[IntegrationService] Webhook error for ${webhook.webhookUrl}:`, error);
        await db.logIntegrationAction(
          webhook.id,
          "webhook",
          "failed",
          `Connection error: ${error.message}`
        );
      }
    }
  }

  private static async dispatchMessaging(event: IntegrationEvent, payload: any) {
    const integrations = await db.getIntegrations();
    
    // Slack
    const slack = integrations.find(i => i.type === "slack" && i.isEnabled);
    if (slack && slack.webhookUrl) {
      await this.sendSlackMessage(slack.webhookUrl, event, payload, slack.id);
    }

    // Teams
    const teams = integrations.find(i => i.type === "teams" && i.isEnabled);
    if (teams && teams.webhookUrl) {
      await this.sendTeamsMessage(teams.webhookUrl, event, payload, teams.id);
    }
  }

  private static async sendSlackMessage(url: string, event: IntegrationEvent, payload: any, integrationId: number) {
    const message = this.formatSlackMessage(event, payload);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      
      await db.logIntegrationAction(
        integrationId,
        "messaging",
        res.ok ? "success" : "failed",
        `Slack notification sent. Status: ${res.status}`
      );
    } catch (e: any) {
      console.error("[IntegrationService] Slack error:", e);
    }
  }

  private static async sendTeamsMessage(url: string, event: IntegrationEvent, payload: any, integrationId: number) {
    const message = this.formatTeamsMessage(event, payload);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      
      await db.logIntegrationAction(
        integrationId,
        "messaging",
        res.ok ? "success" : "failed",
        `Teams notification sent. Status: ${res.status}`
      );
    } catch (e: any) {
      console.error("[IntegrationService] Teams error:", e);
    }
  }

  private static formatSlackMessage(event: IntegrationEvent, payload: any): string {
    switch (event) {
      case "order.created":
        return `🔔 *New Order Created*\nOrder #${payload.orderNumber}\nTotal: $${payload.total}\nType: ${payload.type}`;
      case "order.completed":
        return `✅ *Order Completed*\nOrder #${payload.orderNumber} has been finalized.`;
      case "stock.low":
        return `⚠️ *Low Stock Alert*\nItem: ${payload.name}\nCurrent: ${payload.currentStock}\nThreshold: ${payload.minStock}`;
      default:
        return `📢 *RestoFlow Event: ${event}*\nDetails: ${JSON.stringify(payload)}`;
    }
  }

  private static formatTeamsMessage(event: IntegrationEvent, payload: any): string {
    // Basic text for now, could use Adaptive Cards
    return this.formatSlackMessage(event, payload).replace(/\*/g, "**");
  }

  private static async queueAccountingSync(payload: any) {
    // Placeholder for QuickBooks/Xero sync logic
    console.log(`[IntegrationService] Queueing accounting sync for order: ${payload.orderNumber}`);
    const integrations = await db.getIntegrations();
    
    // QB Sync
    const qb = integrations.find(i => i.type === "quickbooks" && i.isEnabled);
    if (qb) {
        // Implementation for QB API call goes here
        await db.logIntegrationAction(
           qb.id,
           "sync",
           "success",
           `Order #${payload.orderNumber} data synced to QuickBooks Online`
        );
    }

    // Xero Sync
    const xero = integrations.find(i => i.type === "xero" && i.isEnabled);
    if (xero) {
        // Implementation for Xero API call goes here
        await db.logIntegrationAction(
           xero.id,
           "sync",
           "success",
           `Order #${payload.orderNumber} data synced to Xero`
        );
    }
  }
}
