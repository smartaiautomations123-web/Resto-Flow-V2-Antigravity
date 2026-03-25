# RestoFlow: Exhaustive Deep-Dive breakdown

This document serves as the absolute source of truth for the RestoFlow application, mapping every PRD feature, backend helper function, API router, frontend UI page, and database schema to outline the exact data flow for every single module in the system.

---

## 1. MODULE: POS & ORDER MANAGEMENT

### 1.1 PRD Features
*   **Order Taking:** Multi-device support, table management, quick order buttons, item modifiers, open checks.
*   **Kitchen & Bar:** One-touch send to KDS, printing to prep stations (Grill, Fryer, Salad).
*   **Billing:** Split bills by item/percentage, merge tables, discount/promotion application, void/return items with logging, tip handling.
*   **KDS (Kitchen Display System):** Real-time display, FIFO prioritization, audio alerts, custom requests.
*   **Payments:** Cash, Card, Digital Wallets, Split payments, Contactless. Emits thermal receipts and email/SMS receipts.
*   **Menu:** Multiple versions (lunch/dinner), category organization, allergen tags, linked recipes, combos.

### 1.2 Frontend Pages & UI
`POS.tsx`, `KDS.tsx`, `OrderHistory.tsx`, `UnifiedOrderQueue.tsx`, `VoidRefunds.tsx`, `VoidReasonAnalytics.tsx`, `PaymentManagement.tsx`, `PaymentDisputes.tsx`, `TableOrdering.tsx`.

### 1.3 Backend Functions (tRPC Routers: `orders`, `kds`, `tables`, `payments`, `qrCodes`)
*   `createOrder()`, `getOrderById()`, `updateOrder()`, `getOrdersByStatus()`, `getOrdersByTable()`
*   `addOrderItem()`, `updateOrderItem()`, `deleteOrderItem()`
*   `voidOrder()`, `refundOrder()`, `splitBill()`, `mergeOrders()`, `applyDiscount()`, `addTip()`
*   `getOrderQueue()`, `updateOrderStatus()`, `getReceiptData()`, `trackOrderStatus()`

### 1.4 Data Flow & Schema Architecture
1.  **Incoming Order:** The `POS.tsx` creates a new entry in the `orders` table (`id, orderNumber, type, status, tableId, staffId, totals`).
2.  **Item Addition:** Products are added to `order_items`. This table captures `menuItemId`, `quantity`, `unitPrice`, `totalPrice`, `modifiers (JSON)`, and sets status to `pending`.
3.  **Kitchen Lifecycle (KDS):** `KDS.tsx` polls `getOrdersByStatus('pending')`. When staff start cooking, the `order_items.status` shifts to `preparing`, firing a timestamp `sentToKitchenAt`.
4.  **Checkout & Payment:** Payments write to `payment_transactions` (`amount, method, provider, transactionId, status`). If the bill is split, the system creates sub-records in a helper split state.
5.  **Voids & Auditing:** Any cancellations don't just delete rows. They trigger `voidAuditLog` (`orderId, action, reason, performedBy`), ensuring zero untracked revenue loss. `order_void_reasons` and `order_item_void_reasons` categorize the issues (damage, mistake, customer request).

---

## 2. MODULE: INVENTORY & SUPPLY CHAIN

### 2.1 PRD Features
*   **Tracking:** Real-time levels, multiple units (kg, L), batch/lot tracking, expiry dates, stock value.
*   **Recipes:** Standard costing, portion variants, menu item linking.
*   **Stock Counting:** Physical cycles, waste tracking, variance reporting.
*   **Procurement:** Low-stock alerts, AI-generated Purchase Orders, Supplier contract tracking, Price history scanning from PDFs.
*   **Waste:** Log waste with reasons, capture cost, generate reduction suggestions.

### 2.2 Frontend Pages & UI
`Inventory.tsx`, `WasteTracking.tsx`, `Suppliers.tsx`, `SupplierTracking.tsx`, `PriceUploads.tsx`, `RecipeAnalysis.tsx`.

### 2.3 Backend Functions (tRPC Routers: `ingredients`, `recipes`, `suppliers`, `purchaseOrders`, `priceUploads`)
*   `getInventoryValue()`, `updateInventoryLevel()`, `getBatchTracking()`, `getExpiryAlerts()`
*   `createPurchaseOrder()`, `getSupplierLeadTimes()`, `getMinimumOrderQuantities()`
*   `uploadPrices()`, `getVendorProducts()`, `getPriceHistory()`
*   `getWasteLogs()`, `getWasteTrends()`, `getWasteReductionSuggestions()`
*   `createIngredient()`, `createRecipe()`, `getRecipeCostHistory()`

### 2.4 Data Flow & Schema Architecture
1.  **Depletion:** When an `order_item` hits 'completed', a hook calculates the required `ingredients` based on the `recipes` table (`menuItemId → ingredientId + quantity`). It deducts `quantity` from `ingredients.currentStock`.
2.  **Purchasing:** When `currentStock` hits `minStock`, `getReorderRecommendations()` flags it. Managers create entries in `purchase_orders` (`supplierId, status, totalAmount`).
3.  **Vendor Prices:** `price_uploads` handles PDF parsing. extracted data flows to `price_upload_items` (`vendorCode, description, unitPrice, packSize`), and gets permanently recorded in `price_history` to track supplier inflation. `vendor_product_mappings` link external supplier catalogs to internal `ingredientId`.
4.  **Waste Logging:** Spoilage is inserted into `waste_logs` (`ingredient_id, quantity, reason, cost, logged_by`), directly impacting the COGS calculation on the P&L.

---

## 3. MODULE: LABOUR MANAGEMENT & SCHEDULING

### 3.1 PRD Features
*   **Staff Profiles:** Wage rates, restrictions, certifications, roles (Server, Bartender, Manager).
*   **Scheduling:** Drag-and-drop calendars, coverage planning, break enforcement.
*   **Time Tracking:** Clock in/out, GPS/Geofencing validation, overtime logging.
*   **Compliance:** Time-off requests, sick leave tracking, statutory limit monitoring, wage theft prevention.

### 3.2 Frontend Pages & UI
`StaffManagement.tsx`, `LabourManagement.tsx` (includes Timesheets and Overtime dashboards).

### 3.3 Backend Functions (tRPC Routers: `staff`, `shifts`, `timesheet`, `labourManagement`)
*   `clockIn()`, `clockOut()`, `getActiveClockEntry()`, `getTimesheet()`
*   `listShifts()`, `createShift()`, `deleteShift()`
*   `getOvertimeAlerts()`, `getLabourCompliance()`, `getLabourBudget()`, `updateLabourBudget()`
*   `getBiometricTracking()`, `getGPSVerification()`, `getAdvancedPTO()`

### 3.4 Data Flow & Schema Architecture
1.  **Staff Definition:** `staff` table dictates `hourlyRate` and `isActive`. `staff_availability` tracks recurrent limitations (e.g., student unavailable Tuesdays).
2.  **Clocking In:** Actions write to `time_clock` (`staffId, clockIn, clockOut, breakMinutes`). If GPS is required, lat/long data validates the punch.
3.  **Shifts:** Managers build schedules writing to `shifts` (`staffId, date, startTime, endTime`). A background job compares `time_clock` entries against `shifts` to calculate punctuality and unapproved overtime.
4.  **Labour Compliance:** `labour_compliance` tracks `maxHoursPerWeek` and `overtimeThreshold`. If a staff member exceeds this, `overtime_alerts` is populated with `totalHours` and `overtimeHours`, notifying managers before payroll runs.
5.  **Budgeting:** Expected cost vs. real cost accumulates in `labour_budget` (`budgetedHours, actualHours, budgetedCost, actualCost`).

---

## 4. MODULE: FINANCIAL MANAGEMENT & TARGETS

### 4.1 PRD Features
*   **Revenue Management:** Z-Reports (End-of-day), automated daily consolidation.
*   **Costing:** Real-time prime cost algorithms (COGS + Labour), P&L Statements.
*   **Invoicing & Accounts Payable:** Invoice capture, vendor payment tracking.
*   **Profitability Analytics:** Item-level profitability grids (Star/Dog analysis).

### 4.2 Frontend Pages & UI
`Reports.tsx`, `Profitability.tsx`, `ZReports.tsx`.

### 4.3 Backend Functions (tRPC Routers: `reports`, `profitability`, `zReports`, `salesAnalytics`, `primeCost`)
*   `getZReports()`, `createZReport()`, `reconcileZReport()`, `getZReportShifts()`
*   `getProfitabilityByItem()`, `getProfitabilityTrend()`, `getPrimeCost()`
*   `getRevenueByCategory()`, `getRevenueByPaymentMethod()`, `getLabourCostReport()`
*   `getExpenses()`, `createInvoice()`, `recordPayment()`

### 4.4 Data Flow & Schema Architecture
1.  **Closing the Day:** Managers run `createZReport()`. The system queries all `orders.status='completed'` for the day and groups payments by type. It locks this immutable snapshot into `z_reports` (`totalRevenue, totalDiscounts, totalVoids, cashTotal, cardTotal`).
2.  **Item Profitability:** `recipe_cost_history` tracks the rolling average cost of making an item. The system subtracts `recipe_cost_history.totalCost` from `menu_items.price` (minus any `orderDiscounts`) to determine live Gross Margin.
3.  **Shift Recon:** `z_report_shifts` and `z_report_items` break down the overarching `z_report` to hold individual cashiers/waiters accountable.

---

## 5. MODULE: CUSTOMER MANAGEMENT & CRM

### 5.1 PRD Features
*   **Customer Profiles:** Visit history, dietary restrictions, Lifetime Value (LTV), segment ranking.
*   **Loyalty:** Rewards points parsing, birthday automation.
*   **Marketing:** Email & SMS campaigns, personalized discounts.
*   **Feedback:** Post-visit SMS, review aggregation.

### 5.2 Frontend Pages & UI
`Customers.tsx`, `CustomerDetail.tsx`, `CustomerSegments.tsx`, `SmsSettings.tsx`, `EmailCampaigns.tsx`.

### 5.3 Backend Functions (tRPC Routers: `customers`, `segments`, `campaigns`, `sms`, `emailCampaigns`)
*   `getCustomerById()`, `getCustomerSegmentMetrics()`, `getCustomerOrderHistory()`
*   `createCampaign()`, `sendCampaign()`, `createEmailTemplate()`, `sendSMS()`
*   `getCustomerChurnPrediction()`, `getCustomerCLVPrediction()`, `addLoyaltyPoints()`

### 5.4 Data Flow & Schema Architecture
1.  **Acquisition:** A `customer` is created during reservation, online ordering, or loyalty sign-up (`name, email, phone, loyaltyPoints, totalSpent, visitCount`).
2.  **Segmentation Engine:** A CRON job sweeps the DB. Customers matching rules (e.g., totalSpent > $500) are added to `segment_members` mapping to `customer_segments` (e.g., "VIPs").
3.  **Campaigns:** An `email_campaign` or `campaigns` (SMS) targets a `segmentId`. It blasts out messages via integration (Twilio/SendGrid). `campaign_recipients` tracks delivery (`status: pending, sent, opened, clicked, converted`).
4.  **Preferences Tracking:** `customer_sms_preferences` manages GDPR/TCPA compliance (opt-ins for reservations, marketing, order updates).

---

## 6. MODULE: RESERVATIONS & SEATING

### 6.1 PRD Features
*   **Booking:** Online availability checking, Waitlist SMS queuing.
*   **Floor Plan:** Virtual drag-and-drop table layouts, section mappings.
*   **Dynamic Flow:** Table merging/splitting based on party size. Table QR code mapping for contactless dine-in.

### 6.2 Frontend Pages & UI
`Reservations.tsx`, `Waitlist.tsx`, `FloorPlan.tsx`, `QRCodeGenerator.tsx`.

### 6.3 Backend Functions (tRPC Routers: `reservations`, `waitlist`, `sections`, `floorPlan`)
*   `createReservation()`, `getReservationsByDate()`, `getWaitlistQueue()`
*   `addToWaitlist()`, `promoteFromWaitlist()`, `getEstimatedWaitTime()`
*   `getFloorPlan()`, `updateFloorPlan()`, `updateTableStatus()`, `mergeTableOrders()`

### 6.4 Data Flow & Schema Architecture
1.  **Reservations:** Entries go to `reservations` (`guestName, time, partySize, tableId, status`).
2.  **Waitlist Algorithm:** The `waitlist` table handles walk-ins (`position, estimatedWaitTime`). `estimatedWaitTime` is dynamically calculated based on the average table-turnover rate multiplied by `position`.
3.  **Floor Plan Layout:** `sections` (e.g., "Patio") group `tables` (`positionX, positionY, status, seats`). `tableMerges` maps dynamically grouped tables (joining Table 1 and 2 for a party of 8).
4.  **QR Assignment:** `qr_codes` statically links a printed menu QR to a `tableId`, routing web app traffic straight to the table's digital tab.

---

## 7. MODULE: SETTINGS & SYSTEM ARCHITECTURE

### 7.1 Dayparts & Pricing Architecture
*   **Feature:** Time-based pricing (Happy Hours, Lunch Specials).
*   **Data Flow:** `dayparts` table (`startTime, endTime`). `menu_item_dayparts` acts as an override joining `menuItems` and `dayparts`, inserting a temporary `price`.
*   **Menu Groupings:** `combos` and `combo_items` create bundled deals evaluating conditional inclusions.

### 7.2 Multi-Location Architecture
*   **Feature:** Managing multiple physical venues from one head office.
*   **Data Flow:** Almost all core tables (Orders, Staff, Inventory) map via foreign key to the `locations` table (`name, timezone`). Pricing over-rides happen in `locationMenuPrices`. `labour_budget` targets a specific `locationId`.

---

## 8. INTEGRATIONS & API (Backend Built / UI Pending)

*   **Delivery Aggregators:** Uber Eats, DoorDash, Deliveroo. (Injects directly into `orders` with `type="online"`, bypassing manual entry).
*   **Accounting ERP:** Xero, QuickBooks (Syncs `z_reports` and `purchase_orders` into General Ledger journals).
*   **Payroll:** ADP / Sage (Extracts validated `time_clock` entries based on `shifts`).
*   **Webhooks:** Outbound hooks (`createWebhook`, `getWebhookLogs`) trigger on Order Ready, Payment Complete, Low Stock.

### System Scalability Context
RestoFlow operates on Node.js/Express combined with tRPC for end-to-end type safety. Database persistence relies on `Drizzle ORM`, allowing type-safe queries that prevent N+1 issues when fetching dense relations like an Order with its Items, Modifiers, Promos, and Taxes. Real-time updates push via WebSocket/React Query invalidations instantly altering KDS queues and Floor Plan statuses without requiring user refresh.
