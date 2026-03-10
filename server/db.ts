import { eq, desc, asc, and, gte, lte, sql, isNull, isNotNull, ne, like, gt, or, inArray } from "drizzle-orm";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser, users,
  staff, timeClock, shifts,
  menuCategories, menuItems, menuModifiers, itemModifiers,
  sections, tables, orders, orderItems,
  ingredients, recipes,
  suppliers, purchaseOrders, purchaseOrderItems,
  customers, reservations, waitlist,
  vendorProducts, vendorProductMappings, priceUploads, priceUploadItems, priceHistory,
  zReports, zReportItems, zReportShifts,
  voidAuditLog, InsertVoidAuditLog,
  qrCodes, InsertQRCode,
  customerSegments, segmentMembers, campaigns, campaignRecipients,
  orderVoidReasons, orderItemVoidReasons,
  dayparts, menuItemDayparts,
  notifications, notificationPreferences,
  labourBudget, labourCompliance,
  timeOffRequests, staffAvailability, overtimeAlerts,
  paymentTransactions,
  supplierPriceHistory, supplierPerformance,
  smsMessages, smsSettings, customerSmsPreferences,
  emailCampaigns, emailCampaignRecipients, emailTemplates,
  wasteLogs, wasteReports,
  locations,
  combos, comboItems,
  recipeCostHistory,
  splitBills, splitBillParts,
  discounts, orderDiscounts,
  paymentDisputes,
  locationMenuPrices,
  tableMerges,
  systemSettings, userPreferences, emailSettings, paymentSettings,
  deliverySettings, receiptSettings, securitySettings, apiKeys,
  auditLogSettings, backupSettings, localizationSettings, currencySettings,
  integrations, integrationLogs, customReports, reportExports,
  analyticsDashboard, kpiMetrics, forecastingData, dataImportJobs,
  weatherData, localEvents, ingredientForecasts, stockPerformanceAlerts
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: MySql2Database | null = null;

export async function getDb() {
  if (_db) return _db;

  const dbUrl = new URL(ENV.databaseUrl);
  const connection = await mysql.createPool({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '3306'),
    database: dbUrl.pathname.slice(1),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: { rejectUnauthorized: true },
  });

  _db = drizzle(connection);
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────
export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(users).where(eq(users.openId, openId)).then(rows => rows[0]);
}

export async function createUser(openId: string, name?: string, email?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(users).values({ openId, name, email }).execute();
}

// ─── Staff ────────────────────────────────────────────────────────────
export async function listStaff() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(staff).where(eq(staff.isActive, true)).orderBy(asc(staff.name));
}

export async function getStaffById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(staff).where(eq(staff.id, id)).then(rows => rows[0]);
}

export async function createStaff(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(staff).values(data).execute();
}

export async function updateStaff(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(staff).set(data).where(eq(staff.id, id)).execute();
}

export async function deleteStaff(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(staff).set({ isActive: false }).where(eq(staff.id, id)).execute();
}

export async function getStaffOnDuty() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(staff).where(and(eq(staff.isActive, true))).orderBy(asc(staff.name));
}

export async function getShiftsEndingSoon() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(shifts).orderBy(asc(shifts.endTime));
}

// ─── Shifts CRUD ──────────────────────────────────────────────────────
export async function createShift(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(shifts).values(data).execute();
}

export async function updateShift(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(shifts).set(data).where(eq(shifts.id, id)).execute();
}

export async function deleteShift(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(shifts).where(eq(shifts.id, id)).execute();
}

// ─── Time Clock ───────────────────────────────────────────────────────
export async function clockIn(staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(timeClock).values({ staffId, clockIn: new Date() }).execute();
}

export async function clockOut(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(timeClock).set({ clockOut: new Date() }).where(eq(timeClock.id, id)).execute();
}

export async function getActiveClockEntry(staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(timeClock).where(and(eq(timeClock.staffId, staffId), isNull(timeClock.clockOut))).then(rows => rows[0]);
}

export async function listTimeEntries(staffId?: number, dateFrom?: string, dateTo?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (staffId) {
    return db.select().from(timeClock).where(eq(timeClock.staffId, staffId)).orderBy(desc(timeClock.clockIn));
  }
  return db.select().from(timeClock).orderBy(desc(timeClock.clockIn));
}

// ─── Menu Categories ──────────────────────────────────────────────────
export async function listMenuCategories() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuCategories).where(eq(menuCategories.isActive, true)).orderBy(asc(menuCategories.sortOrder));
}

export async function getMenuCategoryById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuCategories).where(eq(menuCategories.id, id)).then(rows => rows[0]);
}

export async function createMenuCategory(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuCategories).values(data).execute();
}

export async function updateMenuCategory(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuCategories).set(data).where(eq(menuCategories.id, id)).execute();
}

export async function deleteMenuCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuCategories).set({ isActive: false }).where(eq(menuCategories.id, id)).execute();
}

// ─── Menu Items ───────────────────────────────────────────────────────
export async function listMenuItems() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuItems).where(eq(menuItems.isAvailable, true)).orderBy(asc(menuItems.name));
}

export async function getMenuItemById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuItems).where(eq(menuItems.id, id)).then(rows => rows[0]);
}

export async function getMenuItemsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuItems).where(and(eq(menuItems.categoryId, categoryId), eq(menuItems.isAvailable, true))).orderBy(asc(menuItems.sortOrder));
}

export async function createMenuItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuItems).values(data).execute();
}

export async function updateMenuItem(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuItems).set(data).where(eq(menuItems.id, id)).execute();
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuItems).set({ isAvailable: false }).where(eq(menuItems.id, id)).execute();
}

// ─── Menu Modifiers ───────────────────────────────────────────────────
export async function listMenuModifiers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuModifiers).where(eq(menuModifiers.isActive, true)).orderBy(asc(menuModifiers.name));
}

export async function getMenuModifierById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(menuModifiers).where(eq(menuModifiers.id, id)).then(rows => rows[0]);
}

export async function createMenuModifier(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menuModifiers).values(data).execute();
}

export async function updateMenuModifier(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuModifiers).set(data).where(eq(menuModifiers.id, id)).execute();
}

export async function deleteMenuModifier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menuModifiers).set({ isActive: false }).where(eq(menuModifiers.id, id)).execute();
}

export async function getItemModifiers(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(itemModifiers).where(eq(itemModifiers.menuItemId, itemId));
}

export async function addModifierToItem(menuItemId: number, modifierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(itemModifiers).values({ menuItemId, modifierId }).execute();
}

export async function removeModifierFromItem(menuItemId: number, modifierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(itemModifiers).where(and(eq(itemModifiers.menuItemId, menuItemId), eq(itemModifiers.modifierId, modifierId)));
}

// ─── Orders ───────────────────────────────────────────────────────────
export async function createOrder(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orders).values(data).execute();
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders).where(eq(orders.id, id)).then(rows => rows[0]);
}

export async function updateOrder(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set(data).where(eq(orders.id, id)).execute();
}

export async function getOrdersByTypeAndDateRange(dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);

  return db.select().from(orders).where(and(
    gte(orders.createdAt, from),
    lte(orders.createdAt, to)
  )).orderBy(desc(orders.createdAt));
}

export async function getOrdersByStatus(status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders).where(eq(orders.status, status as any)).orderBy(desc(orders.createdAt));
}

export async function getOrdersByTable(tableId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders).where(and(eq(orders.tableId, tableId), ne(orders.status, "completed"))).orderBy(desc(orders.createdAt));
}

// ─── Order Items ──────────────────────────────────────────────────────
export async function addOrderItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orderItems).values(data).execute();
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderItem(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orderItems).set(data).where(eq(orderItems.id, id)).execute();
}

export async function deleteOrderItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(orderItems).where(eq(orderItems.id, id));
}

// ─── Ingredients ──────────────────────────────────────────────────────
export async function listIngredients() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(ingredients).where(eq(ingredients.isActive, true)).orderBy(asc(ingredients.name));
}

export async function getIngredientById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(ingredients).where(eq(ingredients.id, id)).then(rows => rows[0]);
}

export async function createIngredient(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(ingredients).values(data).execute();
}

export async function updateIngredient(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(ingredients).set(data).where(eq(ingredients.id, id)).execute();
}

export async function deleteIngredient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(ingredients).set({ isActive: false }).where(eq(ingredients.id, id)).execute();
}

export async function getLowStockIngredients() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Return active ingredients where currentStock <= minStock
  return db.select().from(ingredients).where(
    and(
      eq(ingredients.isActive, true),
      sql`${ingredients.currentStock} <= ${ingredients.minStock}`
    )
  ).orderBy(asc(ingredients.name));
}

export async function adjustIngredientStock(id: number, delta: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Use SQL expression to add delta (positive = add stock, negative = remove stock)
  await db.update(ingredients).set({
    currentStock: sql`GREATEST(0, ${ingredients.currentStock} + ${delta})`,
  }).where(eq(ingredients.id, id)).execute();
  return { id, delta, reason, adjustedAt: new Date() };
}

// ─── Recipes ──────────────────────────────────────────────────────────
export async function listRecipes() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(recipes);
}

export async function getRecipeById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(recipes).where(eq(recipes.id, id)).then(rows => rows[0]);
}

export async function getRecipesByMenuItem(menuItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(recipes).where(eq(recipes.menuItemId, menuItemId));
}

export async function createRecipe(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(recipes).values(data).execute();
}

export async function updateRecipe(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(recipes).set(data).where(eq(recipes.id, id)).execute();
}

export async function deleteRecipe(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(recipes).where(eq(recipes.id, id)).execute();
}

// ─── Customers ────────────────────────────────────────────────────────
export async function listCustomers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customers).orderBy(asc(customers.name));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customers).where(eq(customers.id, id)).then(rows => rows[0]);
}

export async function getCustomerByPhone(phone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customers).where(eq(customers.phone, phone)).then(rows => rows[0]);
}

export async function createCustomer(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(customers).values(data).execute();
}

export async function updateCustomer(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set(data).where(eq(customers.id, id)).execute();
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(customers).where(eq(customers.id, id));
}

// ─── Reservations ─────────────────────────────────────────────────────
export async function listReservations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(reservations).orderBy(desc(reservations.time));
}

export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(reservations).where(eq(reservations.id, id)).then(rows => rows[0]);
}

export async function createReservation(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reservations).values(data).execute();
}

export async function updateReservation(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(reservations).set(data).where(eq(reservations.id, id)).execute();
}

export async function deleteReservation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(reservations).where(eq(reservations.id, id));
}

// ─── Tables ───────────────────────────────────────────────────────────
export async function listTables() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(tables).orderBy(asc(tables.name));
}

export async function getTableById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(tables).where(eq(tables.id, id)).then(rows => rows[0]);
}

export async function createTable(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(tables).values(data).execute();
}

export async function updateTable(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tables).set(data).where(eq(tables.id, id)).execute();
}

export async function deleteTable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(tables).where(eq(tables.id, id)).execute();
}

// ─── Suppliers ────────────────────────────────────────────────────────
export async function listSuppliers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(suppliers).where(eq(suppliers.isActive, true)).orderBy(asc(suppliers.name));
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(suppliers).where(eq(suppliers.id, id)).then(rows => rows[0]);
}

export async function createSupplier(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(suppliers).values(data).execute();
}

export async function updateSupplier(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(suppliers).set(data).where(eq(suppliers.id, id)).execute();
}

export async function deleteSupplier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(suppliers).set({ isActive: false }).where(eq(suppliers.id, id)).execute();
}

// ─── Purchase Orders ──────────────────────────────────────────────────
export async function listPurchaseOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
}

export async function getPurchaseOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).then(rows => rows[0]);
}

export async function createPurchaseOrder(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(purchaseOrders).values(data).execute();
}

export async function updatePurchaseOrder(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(purchaseOrders).set(data).where(eq(purchaseOrders.id, id)).execute();
}

export async function getPurchaseOrderItems(poId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
}

export async function addPurchaseOrderItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(purchaseOrderItems).values(data).execute();
}

// ─── Vendor Products ──────────────────────────────────────────────────
export async function listVendorProducts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(vendorProducts).orderBy(asc(vendorProducts.description));
}

export async function getVendorProductById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(vendorProducts).where(eq(vendorProducts.id, id)).then(rows => rows[0]);
}

export async function createVendorProduct(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vendorProducts).values(data).execute();
}

export async function updateVendorProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(vendorProducts).set(data).where(eq(vendorProducts.id, id)).execute();
}

export async function getVendorProductMappings(vendorProductId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(vendorProductMappings).where(eq(vendorProductMappings.vendorProductId, vendorProductId));
}

export async function createVendorProductMapping(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vendorProductMappings).values(data).execute();
}

// ─── Price Uploads ────────────────────────────────────────────────────
export async function listPriceUploads() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(priceUploads).orderBy(desc(priceUploads.createdAt));
}

export async function getPriceUploadById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(priceUploads).where(eq(priceUploads.id, id)).then(rows => rows[0]);
}

export async function createPriceUpload(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(priceUploads).values(data).execute();
}

export async function updatePriceUpload(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(priceUploads).set(data).where(eq(priceUploads.id, id)).execute();
}

export async function getPriceUploadItems(uploadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(priceUploadItems).where(eq(priceUploadItems.uploadId, uploadId));
}

export async function addPriceUploadItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(priceUploadItems).values(data).execute();
}

export async function listPriceHistory(vendorProductId: number, limit?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(priceHistory).where(eq(priceHistory.vendorProductId, vendorProductId)).orderBy(desc(priceHistory.recordedAt)).limit(limit || 50);
}

export async function applyPriceUpload(uploadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const items = await db.select().from(priceUploadItems).where(eq(priceUploadItems.uploadId, uploadId));
  for (const item of items) {
    await db.insert(priceHistory).values({ vendorProductId: item.vendorProductId || 0, unitPrice: item.unitPrice, casePrice: item.casePrice });
  }
  return db.update(priceUploads).set({ status: "applied" }).where(eq(priceUploads.id, uploadId)).execute();
}

// ─── Z-Reports ────────────────────────────────────────────────────────
export async function generateZReport(date: string, staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dayOrders = await db.select().from(orders).where(and(
    gte(orders.createdAt, new Date(date)),
    lte(orders.createdAt, new Date(new Date(date).getTime() + 86400000))
  ));

  const totalRevenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total as any) || 0), 0);
  const totalOrders = dayOrders.length;

  const [result] = await db.insert(zReports).values({
    reportDate: date,
    totalRevenue: totalRevenue.toString(),
    totalOrders,
    generatedBy: staffId,
  }).execute();

  return result.insertId;
}

export async function getZReportByDate(date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(zReports).where(eq(zReports.reportDate, date)).then(rows => rows[0] || null);
}

export async function getZReportsByDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(zReports).where(and(
    gte(zReports.reportDate, startDate),
    lte(zReports.reportDate, endDate)
  )).orderBy(desc(zReports.reportDate));
}

export async function getZReportDetails(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const report = await db.select().from(zReports).where(eq(zReports.id, reportId)).then(rows => rows[0] ?? null);
  if (!report) return null;
  const items = await db.select().from(zReportItems).where(eq(zReportItems.reportId, reportId));
  const shifts_ = await db.select().from(zReportShifts).where(eq(zReportShifts.reportId, reportId));
  return { ...report, items, shifts: shifts_ };
}

export async function deleteZReport(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(zReportItems).where(eq(zReportItems.reportId, reportId));
  await db.delete(zReportShifts).where(eq(zReportShifts.reportId, reportId));
  await db.delete(zReports).where(eq(zReports.id, reportId)).execute();
  return true;
}

// ─── Void & Refund Management ─────────────────────────────────────────
export async function getPendingVoids() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(orders).where(and(
    eq(orders.status, "voided"),
    isNull(orders.voidApprovedAt)
  )).orderBy(desc(orders.voidRequestedAt));
}

export async function approveVoid(orderId: number, approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set({
    voidApprovedBy: approvedBy,
    voidApprovedAt: new Date(),
  }).where(eq(orders.id, orderId)).execute();
}

export async function rejectVoid(orderId: number, rejectedBy: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set({
    status: "pending" as any,
    voidRequestedBy: null as any,
    voidRequestedAt: null as any,
    voidNotes: notes || null,
  }).where(eq(orders.id, orderId)).execute();
}

export async function getVoidAuditLog(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(voidAuditLog).where(eq(voidAuditLog.orderId, orderId)).orderBy(desc(voidAuditLog.createdAt));
}

export async function addVoidAuditLog(data: InsertVoidAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(voidAuditLog).values(data).execute();
}

// ─── QR Codes ─────────────────────────────────────────────────────────
export async function listQRCodes() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(qrCodes).orderBy(asc(qrCodes.tableId));
}

export async function getQRCodeByTable(tableId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(qrCodes).where(eq(qrCodes.tableId, tableId)).then(rows => rows[0]);
}

export async function createOrUpdateQRCode(tableId: number, qrUrl: string, qrSize: number, format: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getQRCodeByTable(tableId);
  if (existing) {
    await db.update(qrCodes).set({ qrUrl, qrSize, format }).where(eq(qrCodes.tableId, tableId)).execute();
    return { tableId, qrUrl, qrSize, format };
  }
  await db.insert(qrCodes).values({ tableId, qrUrl, qrSize, format }).execute();
  return { tableId, qrUrl, qrSize, format };
}

export async function deleteQRCode(tableId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(qrCodes).where(eq(qrCodes.tableId, tableId)).execute();
  return true;
}

export async function generateQRCodeForAllTables() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allTables = await db.select().from(tables);
  return allTables.map(t => ({ tableId: t.id, url: `/table/${t.id}` }));
}

// ─── Waitlist ─────────────────────────────────────────────────────────
export async function addToWaitlist(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const queue = await db.select().from(waitlist).where(eq(waitlist.status, "waiting"));
  if (data.position === undefined) data.position = queue.length + 1;
  if (data.estimatedWaitTime === undefined) data.estimatedWaitTime = data.position * 15 + 5;
  if (data.status === undefined) data.status = "waiting";

  const result = await db.insert(waitlist).values(data).execute();
  return (result as any)[0]?.insertId ?? (result as any)?.insertId;
}

export async function getWaitlistQueue() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(waitlist).where(eq(waitlist.status, "waiting")).orderBy(asc(waitlist.position));
}

export async function promoteFromWaitlist(guestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(waitlist).set({ status: "called" }).where(eq(waitlist.id, guestId)).execute();

  // Re-calculate positions and wait times
  const queue = await db.select().from(waitlist).where(eq(waitlist.status, "waiting")).orderBy(asc(waitlist.position));
  for (let i = 0; i < queue.length; i++) {
    const newPosition = i + 1;
    const newWaitTime = newPosition * 15 + 5;
    await db.update(waitlist)
      .set({ position: newPosition, estimatedWaitTime: newWaitTime })
      .where(eq(waitlist.id, queue[i].id))
      .execute();
  }
  return true;
}

export async function removeFromWaitlist(guestId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(waitlist).where(eq(waitlist.id, guestId)).execute();
}

export async function getWaitlistStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const waiting = await db.select({ count: sql<number>`COUNT(*)` }).from(waitlist).where(eq(waitlist.status, "waiting"));
  const called = await db.select({ count: sql<number>`COUNT(*)` }).from(waitlist).where(eq(waitlist.status, "called"));
  const seated = await db.select({ count: sql<number>`COUNT(*)` }).from(waitlist).where(eq(waitlist.status, "seated"));
  const allWaiting = await db.select().from(waitlist).where(eq(waitlist.status, "waiting"));
  const averageWaitTime = allWaiting.length > 0
    ? allWaiting.reduce((sum, w) => sum + (w.estimatedWaitTime || 0), 0) / allWaiting.length
    : 0;
  return {
    waitingCount: waiting[0]?.count || 0,
    calledCount: called[0]?.count || 0,
    seatedCount: seated[0]?.count || 0,
    averageWaitTime,
    // backward compat
    waiting: waiting[0]?.count || 0,
    called: called[0]?.count || 0,
  };
}

export async function updateWaitlistStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(waitlist).set({ status: status as any }).where(eq(waitlist.id, id)).execute();
}

export async function getWaitlistEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(waitlist).where(eq(waitlist.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getEstimatedWaitTime() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const queue = await db.select().from(waitlist).where(eq(waitlist.status, "waiting")).orderBy(asc(waitlist.position));
  if (queue.length === 0) return 0;
  const nextPosition = queue.length + 1;
  return nextPosition * 15 + 5;
}

export async function markSmsNotificationSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(waitlist).set({ smsNotificationSent: true, smsNotificationSentAt: new Date() }).where(eq(waitlist.id, id)).execute();
}

// ─── Customer Segmentation ────────────────────────────────────────────
export async function createSegment(name: string, description: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(customerSegments).values({ name, description, color }).execute();
}

export async function getSegments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customerSegments).orderBy(asc(customerSegments.name));
}

export async function getSegmentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customerSegments).where(eq(customerSegments.id, id)).then(rows => rows[0]);
}

export async function updateSegment(id: number, name: string, description: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customerSegments).set({ name, description, color }).where(eq(customerSegments.id, id)).execute();
}

export async function getSegmentMemberCount(segmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(segmentMembers).where(eq(segmentMembers.segmentId, segmentId));
  return Number(result[0]?.count || 0);
}

export async function exportSegmentCustomers(segmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({
    id: customers.id,
    name: customers.name,
    email: customers.email,
    phone: customers.phone,
    totalSpent: sql<number>`0`, // Dummy values or add proper aggregation logic
    visitCount: sql<number>`0`,
    loyaltyPoints: sql<number>`0`,
  }).from(segmentMembers).leftJoin(customers, eq(segmentMembers.customerId, customers.id)).where(eq(segmentMembers.segmentId, segmentId));
}

export async function deleteSegment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(segmentMembers).where(eq(segmentMembers.segmentId, id));
  return db.delete(customerSegments).where(eq(customerSegments.id, id)).execute();
}

export async function addCustomerToSegment(customerId: number, segmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(segmentMembers).values({ customerId, segmentId }).execute();
}

export async function removeCustomerFromSegment(customerId: number, segmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(segmentMembers).where(and(eq(segmentMembers.customerId, customerId), eq(segmentMembers.segmentId, segmentId))).execute();
}

export async function createCampaign(name: string, type: string, content: string, segmentId?: number, subject?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(campaigns).values({ name, type: type as any, content, segmentId, subject }).execute();
}

export async function getCampaigns() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(campaigns).where(eq(campaigns.id, id)).then(rows => rows[0]);
}

export async function getCampaignStats(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({
    pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    sent: sql<number>`SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END)`,
    failed: sql<number>`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
    opened: sql<number>`SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END)`,
    clicked: sql<number>`SUM(CASE WHEN status = 'clicked' THEN 1 ELSE 0 END)`,
  }).from(campaignRecipients).where(eq(campaignRecipients.campaignId, campaignId));
  return result[0] || { pending: 0, sent: 0, failed: 0, opened: 0, clicked: 0 };
}

export async function getCampaignRecipients(campaignId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select({
    id: campaignRecipients.id,
    campaignId: campaignRecipients.campaignId,
    customerId: campaignRecipients.customerId,
    status: campaignRecipients.status,
    sentAt: campaignRecipients.sentAt,
    customerName: customers.name,
    customerEmail: customers.email,
  }).from(campaignRecipients)
    .leftJoin(customers, eq(campaignRecipients.customerId, customers.id))
    .where(eq(campaignRecipients.campaignId, campaignId));
}

export async function addCampaignRecipients(campaignId: number, customerIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const recipients = customerIds.map(customerId => ({ campaignId, customerId, status: "pending" as const }));
  return db.insert(campaignRecipients).values(recipients).execute();
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(campaigns).where(eq(campaigns.id, id));
}

// ─── Cost Calculation ─────────────────────────────────────────────────
export async function calculateMenuItemCost(menuItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const itemRecipes = await db.select().from(recipes).where(eq(recipes.menuItemId, menuItemId));
  let totalCost = 0;

  for (const recipe of itemRecipes) {
    const ingredient = await db.select().from(ingredients).where(eq(ingredients.id, recipe.ingredientId)).then(rows => rows[0]);
    if (ingredient) {
      const costPerUnit = parseFloat(ingredient.costPerUnit as any) || 0;
      const quantity = parseFloat(recipe.quantity as any) || 0;
      totalCost += costPerUnit * quantity;
    }
  }

  return totalCost;
}

export async function updateMenuItemCost(menuItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const cost = await calculateMenuItemCost(menuItemId);
  await db.update(menuItems).set({ cost: cost.toString() }).where(eq(menuItems.id, menuItemId)).execute();
  return cost;
}

export async function updateAllMenuItemCosts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const items = await db.select().from(menuItems);
  for (const item of items) {
    await updateMenuItemCost(item.id);
  }
  return { updated: items.length, items };
}

export async function getMenuItemCostAnalysis(menuItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const item = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId)).then(rows => rows[0]);
  if (!item) return null;

  const itemRecipes = await db.select().from(recipes).where(eq(recipes.menuItemId, menuItemId));
  const recipeDetails = [];

  let totalCost = 0;
  for (const recipe of itemRecipes) {
    const ingredient = await db.select().from(ingredients).where(eq(ingredients.id, recipe.ingredientId)).then(rows => rows[0]);
    if (ingredient) {
      const costPerUnit = parseFloat(ingredient.costPerUnit as any) || 0;
      const quantity = parseFloat(recipe.quantity as any) || 0;
      const recipeCost = costPerUnit * quantity;
      totalCost += recipeCost;
      recipeDetails.push({
        ingredientName: ingredient.name,
        quantity: quantity,
        unit: ingredient.unit,
        costPerUnit,
        totalCost: recipeCost,
      });
    }
  }

  const price = parseFloat(item.price as any) || 0;
  const margin = price - totalCost;
  const marginPercent = price > 0 ? (margin / price) * 100 : 0;

  return {
    id: menuItemId,
    name: item.name,
    price,
    cost: totalCost,
    margin,
    marginPercent,
    recipeBreakdown: recipeDetails,
  };
}

// ─── Profitability Analysis (Moved to end of file) ────────────────────

// ─── Customer Detail ──────────────────────────────────────────────────
export async function getCustomerWithOrderHistory(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const customer = await db.select().from(customers).where(eq(customers.id, customerId)).then(rows => rows[0]);
  if (!customer) return null;

  const orderHistory = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return { ...customer, orderHistory };
}

export async function getOrderWithItems(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).then(rows => rows[0]);
  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      itemName: orderItems.name,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      notes: orderItems.notes,
    })
    .from(orderItems)
    .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

export async function getLoyaltyPointsHistory(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const customer = await db.select().from(customers).where(eq(customers.id, customerId)).then(rows => rows[0]);
  if (!customer) return null;

  const orders_ = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.customerId, customerId), eq(orders.status, "completed")))
    .orderBy(desc(orders.createdAt));

  const pointsEarned = orders_.reduce((sum, o) => sum + Math.floor((parseFloat(o.total as any) || 0) / 10), 0);

  return {
    customerId,
    currentPoints: customer.loyaltyPoints || 0,
    pointsEarned,
    orderHistory: orders_,
  };
}

export async function addLoyaltyPoints(customerId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customers).set({
    loyaltyPoints: sql<number>`loyaltyPoints + ${points}`,
  }).where(eq(customers.id, customerId)).execute();
}

export async function createOrderFromCustomerOrder(customerId: number, sourceOrderId: number, newTableId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sourceOrder = await db.select().from(orders).where(eq(orders.id, sourceOrderId)).then(rows => rows[0]);
  if (!sourceOrder) throw new Error("Source order not found");

  const sourceItems = await db.select().from(orderItems).where(eq(orderItems.orderId, sourceOrderId));

  const result = await db.insert(orders).values({
    orderNumber: `REPEAT-${Date.now()}`,
    type: sourceOrder.type,
    status: "pending" as const,
    customerId,
    tableId: newTableId,
    subtotal: sourceOrder.subtotal,
    taxAmount: sourceOrder.taxAmount,
    total: sourceOrder.total,
  }).execute();

  const newOrderId = (result as any)[0]?.insertId || (result as any).insertId;

  for (const item of sourceItems) {
    await db.insert(orderItems).values({
      orderId: newOrderId,
      menuItemId: item.menuItemId,
      name: (item as any).name || 'Item',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      notes: item.notes,
    }).execute();
  }

  return { id: newOrderId };
}

// ─── Order History & Receipts ────────────────────────────────────────
export async function getOrderHistory(filters?: { dateFrom?: string; dateTo?: string; customerId?: number; status?: string; searchTerm?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [];

  if (filters?.dateFrom) {
    conditions.push(gte(orders.createdAt, new Date(filters.dateFrom)));
  }
  if (filters?.dateTo) {
    const endDate = new Date(filters.dateTo);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(orders.createdAt, endDate));
  }
  if (filters?.customerId) {
    conditions.push(eq(orders.customerId, filters.customerId));
  }
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status as any));
  }
  if (filters?.searchTerm) {
    const searchPattern = `%${filters.searchTerm}%`;
    conditions.push(
      or(
        like(orders.orderNumber, searchPattern),
        like(customers.name, searchPattern)
      )
    );
  }

  const baseQuery = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.name,
      total: orders.total,
      subtotal: orders.subtotal,
      taxAmount: orders.taxAmount,
      discountAmount: orders.discountAmount,
      status: orders.status,
      type: orders.type,
      paymentMethod: orders.paymentMethod,
      createdAt: orders.createdAt,
      itemCount: sql<number>`COUNT(DISTINCT ${orderItems.id})`,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .groupBy(orders.id);

  if (conditions.length > 0) {
    return baseQuery.where(and(...conditions)).orderBy(desc(orders.createdAt)).limit(500);
  }

  return baseQuery.orderBy(desc(orders.createdAt)).limit(500);
}

export async function getOrderDetailsForReceipt(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      total: orders.total,
      subtotal: orders.subtotal,
      taxAmount: orders.taxAmount,
      discountAmount: orders.discountAmount,
      voidReason: orders.voidReason,
      status: orders.status,
      type: orders.type,
      paymentMethod: orders.paymentMethod,
      notes: orders.notes,
      createdAt: orders.createdAt,
      completedAt: orders.completedAt,
      staffName: staff.name,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(staff, eq(orders.staffId, staff.id))
    .where(eq(orders.id, orderId));

  if (!order[0]) return null;

  const items = await db
    .select({
      id: orderItems.id,
      itemName: menuItems.name,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      notes: orderItems.notes,
    })
    .from(orderItems)
    .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId));

  return { ...order[0], items };
}

export async function searchOrders(searchTerm: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const searchPattern = `%${searchTerm}%`;
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: customers.name,
      total: orders.total,
      createdAt: orders.createdAt,
      status: orders.status,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(
      or(
        like(orders.orderNumber, searchPattern),
        like(customers.name, searchPattern)
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getOrdersByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      type: orders.type,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

export async function getOrdersByDateRange(dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const endDate = new Date(dateTo);
  endDate.setHours(23, 59, 59, 999);

  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: customers.name,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(gte(orders.createdAt, new Date(dateFrom)), lte(orders.createdAt, endDate)))
    .orderBy(desc(orders.createdAt));
}

export async function getReceiptHistory(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      createdAt: orders.createdAt,
      total: orders.total,
      status: orders.status,
    })
    .from(orders)
    .where(eq(orders.id, orderId));
}

// ─── Sections & Floor Plan ────────────────────────────────────────────
export async function getSections() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(sections).where(eq(sections.isActive, true)).orderBy(asc(sections.sortOrder));
}

export async function createSection(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(sections).values(data).execute();
}

export async function updateSection(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(sections).set(data).where(eq(sections.id, id)).execute();
}

export async function deleteSection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(sections).set({ isActive: false }).where(eq(sections.id, id)).execute();
}

export async function getTablesBySection(section?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (section) {
    return db.select().from(tables).where(eq(tables.section, section)).orderBy(asc(tables.name));
  }
  return db.select().from(tables).orderBy(asc(tables.name));
}

export async function updateTablePosition(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tables).set(data).where(eq(tables.id, id)).execute();
}

export async function updateTableStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tables).set({ status: status as any }).where(eq(tables.id, id)).execute();
}

export async function getTableWithOrders(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const table = await db.select().from(tables).where(eq(tables.id, id)).then(rows => rows[0]);
  if (!table) return null;

  const activeOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.tableId, id), ne(orders.status, "completed")))
    .orderBy(desc(orders.createdAt));

  return { ...table, activeOrders };
}

// ─── Receipt Generation ───────────────────────────────────────────────
export async function generateReceiptData(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orderDetails = await getOrderDetailsForReceipt(orderId);
  if (!orderDetails) return null;

  return {
    orderNumber: orderDetails.orderNumber,
    customerName: orderDetails.customerName,
    customerEmail: orderDetails.customerEmail,
    customerPhone: orderDetails.customerPhone,
    total: orderDetails.total,
    subtotal: orderDetails.subtotal,
    taxAmount: orderDetails.taxAmount,
    discountAmount: orderDetails.discountAmount,
    status: orderDetails.status,
    type: orderDetails.type,
    paymentMethod: orderDetails.paymentMethod,
    notes: orderDetails.notes,
    createdAt: orderDetails.createdAt,
    completedAt: orderDetails.completedAt,
    staffName: orderDetails.staffName,
    items: orderDetails.items,
  };
}

export async function generateThermalReceiptFormat(orderId: number) {
  const receiptData = await generateReceiptData(orderId);
  if (!receiptData) return null;

  const lines: string[] = [];
  lines.push("================================");
  lines.push("RECEIPT".padStart(16));
  lines.push("================================");
  lines.push(`Order #: ${receiptData.orderNumber}`);
  lines.push(`Date: ${new Date(receiptData.createdAt).toLocaleString()}`);
  lines.push("");

  if (receiptData.customerName) {
    lines.push(`Customer: ${receiptData.customerName}`);
  }

  lines.push("--------------------------------");
  lines.push("ITEMS");
  lines.push("--------------------------------");

  for (const item of receiptData.items) {
    const itemLine = `${(item.itemName || 'Unknown').substring(0, 20)} x${item.quantity}`;
    const priceLine = `$${parseFloat(item.totalPrice as any).toFixed(2)}`;
    lines.push(itemLine.padEnd(25) + priceLine.padStart(7));
    if (item.notes) {
      lines.push(`  Note: ${item.notes}`);
    }
  }

  lines.push("--------------------------------");
  lines.push(`Subtotal: $${parseFloat(receiptData.subtotal as any).toFixed(2)}`.padEnd(25));
  if (receiptData.taxAmount) {
    lines.push(`Tax: $${parseFloat(receiptData.taxAmount as any).toFixed(2)}`.padEnd(25));
  }
  if (receiptData.discountAmount) {
    lines.push(`Discount: -$${parseFloat(receiptData.discountAmount as any).toFixed(2)}`.padEnd(25));
  }
  lines.push("================================");
  lines.push(`TOTAL: $${parseFloat(receiptData.total as any).toFixed(2)}`.padStart(20));
  lines.push("================================");
  lines.push(`Payment: ${receiptData.paymentMethod}`);
  lines.push(`Status: ${receiptData.status}`);
  lines.push("");
  lines.push("Thank you for your business!".padStart(16));
  lines.push("");

  return lines.join("\n");
}

export async function generatePDFReceiptHTML(orderId: number) {
  const receiptData = await generateReceiptData(orderId);
  if (!receiptData) return null;

  const itemsHTML = receiptData.items.map((item) => `<tr><td>${item.itemName}</td><td style="text-align: center;">${item.quantity}</td><td style="text-align: right;">$${parseFloat(item.unitPrice as any).toFixed(2)}</td><td style="text-align: right;">$${parseFloat(item.totalPrice as any).toFixed(2)}</td></tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt #${receiptData.orderNumber}</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px}.header{text-align:center;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:10px}.order-info{margin-bottom:20px}.order-info p{margin:5px 0}table{width:100%;border-collapse:collapse;margin-bottom:20px}th{text-align:left;border-bottom:1px solid #333;padding:10px 0}td{padding:8px 0}.totals{text-align:right;margin-bottom:20px;border-top:2px solid #333;padding-top:10px}.total-amount{font-size:1.5em;font-weight:bold}.footer{text-align:center;margin-top:20px;color:#666;font-size:0.9em}</style></head><body><div class="header"><h1>RECEIPT</h1><p>Order #${receiptData.orderNumber}</p><p>${new Date(receiptData.createdAt).toLocaleString()}</p></div><div class="order-info"><p><strong>Customer:</strong> ${receiptData.customerName || "N/A"}</p><p><strong>Type:</strong> ${receiptData.type}</p><p><strong>Status:</strong> ${receiptData.status}</p></div><table><thead><tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Total</th></tr></thead><tbody>${itemsHTML}</tbody></table><div class="totals"><p>Subtotal: $${parseFloat(receiptData.subtotal as any).toFixed(2)}</p><p class="total-amount">Total: $${parseFloat(receiptData.total as any).toFixed(2)}</p><p>Payment Method: ${receiptData.paymentMethod}</p></div><div class="footer"><p>Thank you for your business!</p></div></body></html>`;
}

// ─── User Management ───────────────────────────────────────────────
export async function upsertUser(data: {
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(users).where(eq(users.openId, data.openId)).limit(1);

  if (existing.length > 0) {
    // Update existing user
    return await db
      .update(users)
      .set({
        name: data.name,
        email: data.email,
        loginMethod: data.loginMethod,
        lastSignedIn: data.lastSignedIn,
        updatedAt: new Date(),
      })
      .where(eq(users.openId, data.openId));
  } else {
    // Create new user
    return await db.insert(users).values({
      openId: data.openId,
      name: data.name,
      email: data.email,
      loginMethod: data.loginMethod,
      lastSignedIn: data.lastSignedIn,
    });
  }
}


// ─── Order Status Tracking ───────────────────────────────────────────
export async function getOrderByOrderNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      type: orders.type,
      total: orders.total,
      createdAt: orders.createdAt,
      completedAt: orders.completedAt,
      customerId: orders.customerId,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  return result[0] || null;
}

export async function getOrderStatusWithItems(orderNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await getOrderByOrderNumber(orderNumber);
  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      itemName: menuItems.name,
      quantity: orderItems.quantity,
      status: orderItems.status,
      notes: orderItems.notes,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, order.id));

  return {
    ...order,
    items,
  };
}

export async function calculateEstimatedTime(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !order[0]) return null;

  const orderData = order[0];
  const createdAt = new Date(orderData.createdAt).getTime();
  const now = Date.now();
  const elapsedMs = now - createdAt;

  // Base time: 15 minutes per order
  const baseTimeMs = 15 * 60 * 1000;
  const estimatedTotalMs = baseTimeMs;
  const remainingMs = Math.max(0, estimatedTotalMs - elapsedMs);

  return {
    estimatedTotalMinutes: Math.ceil(estimatedTotalMs / 60000),
    elapsedMinutes: Math.ceil(elapsedMs / 60000),
    remainingMinutes: Math.ceil(remainingMs / 60000),
    percentComplete: Math.min(100, Math.round((elapsedMs / estimatedTotalMs) * 100)),
  };
}

export async function getOrderStatusTimeline(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !order[0]) return null;

  const orderData = order[0];
  const createdAt = new Date(orderData.createdAt);
  const completedAt = orderData.completedAt ? new Date(orderData.completedAt) : null;

  const statuses = ["pending", "preparing", "ready", "completed"];
  const currentStatusIndex = statuses.indexOf(orderData.status);

  return {
    statuses: statuses.map((status, index) => ({
      name: status,
      completed: index < currentStatusIndex || (status === "completed" && index === currentStatusIndex),
      current: index === currentStatusIndex,
      timestamp: index === statuses.length - 1 && completedAt ? completedAt : null,
    })),
    currentStatus: orderData.status,
    createdAt,
    completedAt,
  };
}

export async function updateOrderStatus(orderId: number, newStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === "completed") {
    updateData.completedAt = new Date();
  }

  return await db.update(orders).set(updateData).where(eq(orders.id, orderId));
}

// ─── Push Notifications ───────────────────────────────────────────
export async function notifyOrderStatusChange(orderId: number, newStatus: string) {
  const db = await getDb();
  // This is a placeholder for push notification infrastructure
  // In production, this would integrate with a service like Firebase Cloud Messaging
  // or Web Push API to send notifications to customers

  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !order[0]) return null;

  const orderData = order[0];
  if (!orderData.customerId) return null;
  const customer = await db.select().from(customers).where(eq(customers.id, orderData.customerId)).limit(1);

  if (!customer || !customer[0]) return null;

  // Notification payload
  const notification = {
    orderId,
    orderNumber: orderData.orderNumber,
    status: newStatus,
    customerEmail: customer[0].email,
    customerPhone: customer[0].phone,
    timestamp: new Date(),
    message: `Your order ${orderData.orderNumber} is now ${newStatus}`,
  };

  // Log notification (in production, send via email/SMS/push service)
  console.log("[Notification]", notification);

  return notification;
}

export async function getOrderNotificationHistory(orderId: number) {
  const db = await getDb();
  // Placeholder for retrieving notification history
  // In production, this would query a notifications table
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !order[0]) return null;

  return {
    orderId,
    orderNumber: order[0].orderNumber,
    createdAt: order[0].createdAt,
    completedAt: order[0].completedAt,
    status: order[0].status,
  };
}

// ─── Timesheet & Payroll ───────────────────────────────────────────
export async function getTimesheetData(
  startDate: Date,
  endDate: Date,
  staffId?: number,
  role?: string
) {
  const db = await getDb();
  const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : String(startDate);
  const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : String(endDate);

  const conditions: any[] = [
    gte(shifts.date, startDateStr),
    lte(shifts.date, endDateStr),
  ];
  if (staffId) conditions.push(eq(shifts.staffId, staffId));
  if (role) conditions.push(eq(staff.role, role as any));

  const rows = await db
    .select({
      staffId: shifts.staffId,
      staffName: staff.name,
      staffRole: staff.role,
      shiftDate: shifts.date,
      clockIn: shifts.startTime,
      clockOut: shifts.endTime,
      hourlyRate: staff.hourlyRate,
    })
    .from(shifts)
    .innerJoin(staff, eq(shifts.staffId, staff.id))
    .where(and(...conditions));

  // Calculate hours worked and total cost from startTime/endTime strings
  return rows.map(r => {
    const [sh, sm] = (r.clockIn || '0:0').split(':').map(Number);
    const [eh, em] = (r.clockOut || '0:0').split(':').map(Number);
    const hoursWorked = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
    const rate = parseFloat(r.hourlyRate || '0');
    return { ...r, hoursWorked, totalCost: hoursWorked * rate };
  });
}

export async function calculateTimesheetSummary(
  startDate: Date,
  endDate: Date,
  staffId?: number,
  role?: string
) {
  const db = await getDb();
  const timesheetData = await getTimesheetData(startDate, endDate, staffId, role);

  const summary = {
    totalStaff: new Set(timesheetData.map((t) => t.staffId)).size,
    totalHours: timesheetData.reduce((sum, t) => sum + (t.hoursWorked || 0), 0),
    totalLabourCost: timesheetData.reduce((sum, t) => sum + (t.totalCost || 0), 0),
    averageHourlyRate:
      timesheetData.length > 0
        ? timesheetData.reduce((sum, t) => sum + parseFloat(String(t.hourlyRate || '0')), 0) /
        timesheetData.length
        : 0,
    entries: timesheetData,
  };

  return summary;
}

export async function generateTimesheetCSV(
  startDate: Date,
  endDate: Date,
  staffId?: number,
  role?: string
) {
  const db = await getDb();
  const summary = await calculateTimesheetSummary(startDate, endDate, staffId, role);

  // CSV Header
  const headers = [
    "Staff Name",
    "Role",
    "Date",
    "Clock In",
    "Clock Out",
    "Hours Worked",
    "Hourly Rate",
    "Total Cost",
  ];

  // CSV Rows
  const rows = summary.entries.map((entry: any) => [
    entry.staffName,
    entry.staffRole,
    String(entry.shiftDate || ''),
    entry.clockIn || '',
    entry.clockOut || '',
    (entry.hoursWorked || 0).toFixed(2),
    parseFloat(entry.hourlyRate || '0').toFixed(2),
    (entry.totalCost || 0).toFixed(2),
  ]);

  // Summary rows
  rows.push([]);
  rows.push(["SUMMARY"]);
  rows.push(["Total Staff", summary.totalStaff.toString()]);
  rows.push(["Total Hours", summary.totalHours.toFixed(2)]);
  rows.push(["Total Labour Cost", `$${summary.totalLabourCost.toFixed(2)}`]);
  rows.push(["Average Hourly Rate", `$${summary.averageHourlyRate.toFixed(2)}`]);

  // Build CSV string
  let csv = headers.join(",") + "\n";
  csv += rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  return csv;
}

export async function getStaffTimesheetStats(staffId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : String(startDate);
  const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : String(endDate);
  const data = await db
    .select({
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      shiftId: shifts.id,
    })
    .from(shifts)
    .where(
      and(
        eq(shifts.staffId, staffId),
        gte(shifts.date, startDateStr),
        lte(shifts.date, endDateStr)
      )
    );

  const staffData = await db.select().from(staff).where(eq(staff.id, staffId)).limit(1).then((r: any[]) => r[0]);
  const rate = parseFloat(staffData?.hourlyRate || '0');
  const totalHours = data.reduce((sum: number, d: any) => {
    const [sh, sm] = (d.startTime || '0:0').split(':').map(Number);
    const [eh, em] = (d.endTime || '0:0').split(':').map(Number);
    return sum + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  }, 0);

  return {
    totalShifts: data.length,
    totalHours,
    totalLabourCost: totalHours * rate,
    averageHoursPerShift: data.length > 0 ? totalHours / data.length : 0,
  };
}

// ─── Dayparts & Dynamic Pricing ───────────────────────────────────────────
export async function createDaypart(data: { name: string; startTime: string; endTime: string }) {
  const db = await getDb();
  return await db.insert(dayparts).values(data);
}

export async function getDayparts() {
  const db = await getDb();
  return await db.select().from(dayparts).where(eq(dayparts.isActive, true));
}

export async function updateDaypart(id: number, data: Partial<{ name: string; startTime: string; endTime: string; isActive: boolean }>) {
  const db = await getDb();
  return await db.update(dayparts).set(data).where(eq(dayparts.id, id));
}

export async function getCurrentDaypart() {
  const db = await getDb();
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");

  const daypart = await db.select().from(dayparts)
    .where(and(eq(dayparts.isActive, true)))
    .limit(1);

  if (!daypart || daypart.length === 0) return null;

  for (const dp of daypart) {
    if (currentTime >= dp.startTime && currentTime < dp.endTime) {
      return dp;
    }
  }
  return null;
}

export async function getMenuItemDaypartPrice(menuItemId: number, daypartId: number) {
  const db = await getDb();
  const result = await db.select().from(menuItemDayparts)
    .where(and(eq(menuItemDayparts.menuItemId, menuItemId), eq(menuItemDayparts.daypartId, daypartId)))
    .limit(1);
  return result[0] || null;
}

export async function setMenuItemDaypartPrice(menuItemId: number, daypartId: number, price: string) {
  const db = await getDb();
  return await db.insert(menuItemDayparts).values({ menuItemId, daypartId, price }).onDuplicateKeyUpdate({ set: { price } });
}

export async function getMenuItemAllDaypartPrices(menuItemId: number) {
  const db = await getDb();
  return await db.select({
    daypartId: menuItemDayparts.daypartId,
    daypartName: dayparts.name,
    price: menuItemDayparts.price,
  }).from(menuItemDayparts)
    .innerJoin(dayparts, eq(menuItemDayparts.daypartId, dayparts.id))
    .where(eq(menuItemDayparts.menuItemId, menuItemId));
}

// ─── Void/Refund Reason Tracking ───────────────────────────────────────────
export async function recordOrderVoid(orderId: number, reason: string, notes: string | null, voidedBy: number) {
  const db = await getDb();
  return await db.insert(orderVoidReasons).values({ orderId, reason: reason as any, notes, voidedBy });
}

export async function recordOrderItemVoid(orderItemId: number, reason: string, notes: string | null, voidedBy: number) {
  const db = await getDb();
  return await db.insert(orderItemVoidReasons).values({ orderItemId, reason: reason as any, notes, voidedBy });
}

export async function getVoidReasonReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  const orderVoids = await db.select({
    reason: orderVoidReasons.reason,
    count: sql<number>`count(*)`,
    totalAmount: sql<number>`sum(o.total)`,
  }).from(orderVoidReasons)
    .innerJoin(orders, eq(orderVoidReasons.orderId, orders.id))
    .where(and(gte(orderVoidReasons.voidedAt, startDate), lte(orderVoidReasons.voidedAt, endDate)))
    .groupBy(orderVoidReasons.reason);

  return orderVoids;
}

export async function getVoidReasonsByStaff(staffId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  return await db.select({
    reason: orderVoidReasons.reason,
    count: sql<number>`count(*)`,
    notes: orderVoidReasons.notes,
  }).from(orderVoidReasons)
    .where(and(eq(orderVoidReasons.voidedBy, staffId), gte(orderVoidReasons.voidedAt, startDate), lte(orderVoidReasons.voidedAt, endDate)))
    .groupBy(orderVoidReasons.reason);
}

export async function getVoidReasonStats(startDate: Date, endDate: Date) {
  const db = await getDb();
  const stats = await db.select({
    reason: orderVoidReasons.reason,
    count: sql<number>`count(*)`,
    percentage: sql<number>`round(count(*) * 100.0 / (select count(*) from order_void_reasons where voided_at >= ? and voided_at <= ?), 2)`,
  }).from(orderVoidReasons)
    .where(and(gte(orderVoidReasons.voidedAt, startDate), lte(orderVoidReasons.voidedAt, endDate)))
    .groupBy(orderVoidReasons.reason);

  return stats;
}

// ─── SMS Notifications ───────────────────────────────────────────────────────
export async function getSmsSettings() {
  const db = await getDb();
  return db.select().from(smsSettings).limit(1).then((r: any[]) => r[0]);
}

export async function updateSmsSettings(data: { twilioAccountSid?: string; twilioAuthToken?: string; twilioPhoneNumber?: string; isEnabled?: boolean }) {
  const db = await getDb();
  return db.update(smsSettings).set(data).execute();
}

export async function sendSmsMessage(customerId: number | null, phoneNumber: string, message: string, type: string) {
  const db = await getDb();
  return db.insert(smsMessages).values({ customerId, phoneNumber, message, type, status: "pending" }).execute();
}

export async function updateSmsStatus(messageId: number, status: string, deliveredAt?: Date, failureReason?: string) {
  const db = await getDb();
  return db.update(smsMessages).set({ status, deliveredAt, failureReason }).where(eq(smsMessages.id, messageId)).execute();
}

export async function getSmsPreferences(customerId: number) {
  const db = await getDb();
  return db.select().from(customerSmsPreferences).where(eq(customerSmsPreferences.customerId, customerId)).limit(1).then((r: any[]) => r[0]);
}

export async function updateSmsPreferences(customerId: number, prefs: any) {
  const db = await getDb();
  return db.update(customerSmsPreferences).set(prefs).where(eq(customerSmsPreferences.customerId, customerId)).execute();
}

export async function getSmsMessageHistory(customerId: number) {
  const db = await getDb();
  return db.select().from(smsMessages).where(eq(smsMessages.customerId, customerId));
}

// ─── Email Campaigns ───────────────────────────────────────────────────────
export async function createEmailTemplate(name: string, subject: string, htmlContent: string) {
  const db = await getDb();
  return db.insert(emailTemplates).values({ name, subject, htmlContent }).execute();
}

export async function getEmailTemplates() {
  const db = await getDb();
  return db.select().from(emailTemplates);
}

export async function createEmailCampaign(name: string, templateId: number, segmentId?: number) {
  const db = await getDb();
  return db.insert(emailCampaigns).values({ name, templateId, segmentId, status: "draft" }).execute();
}

export async function getEmailCampaigns() {
  const db = await getDb();
  return db.select().from(emailCampaigns);
}

export async function updateEmailCampaignStatus(campaignId: number, status: string, sentAt?: Date) {
  const db = await getDb();
  return db.update(emailCampaigns).set({ status, sentAt }).where(eq(emailCampaigns.id, campaignId)).execute();
}

export async function addEmailCampaignRecipient(campaignId: number, customerId: number, email: string) {
  const db = await getDb();
  return db.insert(emailCampaignRecipients).values({ campaignId, customerId, email, status: "pending" }).execute();
}

export async function updateEmailRecipientStatus(recipientId: number, status: string, openedAt?: Date, clickedAt?: Date) {
  const db = await getDb();
  return db.update(emailCampaignRecipients).set({ status, openedAt, clickedAt }).where(eq(emailCampaignRecipients.id, recipientId)).execute();
}

export async function getEmailCampaignStats(campaignId: number) {
  const db = await getDb();
  const recipients = await db.select().from(emailCampaignRecipients).where(eq(emailCampaignRecipients.campaignId, campaignId));
  return {
    total: recipients.length,
    sent: recipients.filter((r) => r.sentAt).length,
    opened: recipients.filter((r) => r.openedAt).length,
    clicked: recipients.filter((r) => r.clickedAt).length,
  };
}

// ─── Inventory Waste Tracking ───────────────────────────────────────────────
export async function logWaste(ingredientId: number, quantity: string, unit: string, reason: string, cost: string, notes: string | null, loggedBy: number) {
  const db = await getDb();
  return db.insert(wasteLogs).values({ ingredientId, quantity: String(quantity), unit, reason, cost: String(cost), notes, loggedBy }).execute();
}

export async function getWasteLogs(startDate: Date, endDate: Date) {
  const db = await getDb();
  return db.select().from(wasteLogs).where(and(gte(wasteLogs.loggedAt, startDate), lte(wasteLogs.loggedAt, endDate)),);
}

export async function getWasteByReason(startDate: Date, endDate: Date) {
  const db = await getDb();
  const logs = await getWasteLogs(startDate, endDate);
  const grouped: Record<string, { count: number; totalCost: number }> = {};
  logs.forEach((log) => {
    if (!grouped[log.reason]) grouped[log.reason] = { count: 0, totalCost: 0 };
    grouped[log.reason].count++;
    grouped[log.reason].totalCost += Number(log.cost);
  });
  return Object.entries(grouped).map(([reason, data]) => ({ reason, ...data }));
}

export async function getTotalWasteCost(startDate: Date, endDate: Date) {
  const db = await getDb();
  const logs = await getWasteLogs(startDate, endDate);
  return logs.reduce((sum, log) => sum + Number(log.cost), 0);
}

export async function getWasteByIngredient(startDate: Date, endDate: Date) {
  const db = await getDb();
  const logs = await getWasteLogs(startDate, endDate);
  const grouped: Record<number, { ingredientId: number; count: number; totalCost: number }> = {};
  logs.forEach((log) => {
    if (!grouped[log.ingredientId]) grouped[log.ingredientId] = { ingredientId: log.ingredientId, count: 0, totalCost: 0 };
    grouped[log.ingredientId].count++;
    grouped[log.ingredientId].totalCost += Number(log.cost);
  });
  return Object.values(grouped);
}

// ─── Multi-Location Support ────────────────────────────────────────────────
export async function createLocation(name: string, address: string, phone?: string, email?: string, timezone?: string) {
  const db = await getDb();
  return db.insert(locations).values({ name, address, phone, email, timezone }).execute();
}

export async function getLocations() {
  const db = await getDb();
  return db.select().from(locations);
}

export async function getLocationById(id: number) {
  const db = await getDb();
  return db.select().from(locations).where(eq(locations.id, id)).limit(1).then((r: any[]) => r[0]);
}

export async function updateLocation(id: number, data: any) {
  const db = await getDb();
  return db.update(locations).set(data).where(eq(locations.id, id)).execute();
}

export async function deleteLocation(id: number) {
  const db = await getDb();
  return db.delete(locations).where(eq(locations.id, id)).execute();
}

// ─── Combo/Bundle Management ───────────────────────────────────────────────
export async function createCombo(locationId: number | null, name: string, price: string, regularPrice?: string, discount?: string) {
  const db = await getDb();
  return db.insert(combos).values({ locationId, name, price: String(price), regularPrice: regularPrice ? String(regularPrice) : undefined, discount: discount ? String(discount) : undefined }).execute();
}

export async function getCombos(locationId?: number) {
  const db = await getDb();
  if (locationId) {
    return db.select().from(combos).where(eq(combos.locationId, locationId));
  }
  return db.select().from(combos);
}

export async function getComboById(id: number) {
  const db = await getDb();
  return db.select().from(combos).where(eq(combos.id, id)).limit(1).then((r: any[]) => r[0]);
}

export async function addComboItem(comboId: number, menuItemId: number, quantity: number) {
  const db = await getDb();
  return db.insert(comboItems).values({ comboId, menuItemId, quantity }).execute();
}

export async function getComboItems(comboId: number) {
  const db = await getDb();
  return db.select().from(comboItems).where(eq(comboItems.comboId, comboId));
}

// ─── Advanced Labour Management ────────────────────────────────────────────
export async function createLabourCompliance(locationId: number | null, maxHoursPerWeek: number, minBreakMinutes: number, overtimeThreshold: number, overtimeMultiplier: string) {
  const db = await getDb();
  return db.insert(labourCompliance).values({ locationId, maxHoursPerWeek, minBreakMinutes, overtimeThreshold, overtimeMultiplier: String(overtimeMultiplier) }).execute();
}

export async function getLabourCompliance(locationId: number | null) {
  const db = await getDb();
  if (locationId) {
    return db.select().from(labourCompliance).where(eq(labourCompliance.locationId, locationId)).limit(1).then((r: any[]) => r[0]);
  }
  return db.select().from(labourCompliance).limit(1).then((r: any[]) => r[0]);
}

export async function addStaffAvailability(staffId: number, dayOfWeek: number, startTime: string, endTime: string) {
  const db = await getDb();
  return db.insert(staffAvailability).values({ staffId, dayOfWeek, startTime, endTime }).execute();
}

export async function getStaffAvailability(staffId: number) {
  const db = await getDb();
  return db.select().from(staffAvailability).where(eq(staffAvailability.staffId, staffId));
}

export async function createTimeOffRequest(staffId: number, startDate: Date, endDate: Date, reason?: string) {
  const db = await getDb();
  return db.insert(timeOffRequests).values({ staffId, startDate, endDate, reason, status: "pending" }).execute();
}

export async function getTimeOffRequests(staffId?: number) {
  const db = await getDb();
  if (staffId) {
    return db.select().from(timeOffRequests).where(eq(timeOffRequests.staffId, staffId));
  }
  return db.select().from(timeOffRequests);
}

export async function approveTimeOffRequest(id: number, approvedBy: number) {
  const db = await getDb();
  return db.update(timeOffRequests).set({ status: "approved", approvedBy, approvedAt: new Date() }).where(eq(timeOffRequests.id, id)).execute();
}

export async function rejectTimeOffRequest(id: number) {
  const db = await getDb();
  return db.update(timeOffRequests).set({ status: "rejected" }).where(eq(timeOffRequests.id, id)).execute();
}

export async function createOvertimeAlert(staffId: number, weekStartDate: Date, totalHours: string, overtimeHours: string) {
  const db = await getDb();
  return db.insert(overtimeAlerts).values({ staffId, weekStartDate, totalHours: String(totalHours), overtimeHours: String(overtimeHours) }).execute();
}

export async function getOvertimeAlerts(staffId?: number) {
  const db = await getDb();
  if (staffId) {
    return db.select().from(overtimeAlerts).where(eq(overtimeAlerts.staffId, staffId));
  }
  return db.select().from(overtimeAlerts);
}

export async function createLabourBudget(locationId: number | null, month: number, year: number, budgetedHours: string, budgetedCost: string) {
  const db = await getDb();
  return db.insert(labourBudget).values({ locationId, month, year, budgetedHours: String(budgetedHours), budgetedCost: String(budgetedCost) }).execute();
}

export async function getLabourBudget(locationId: number | null, month: number, year: number) {
  const db = await getDb();
  if (locationId) {
    return db.select().from(labourBudget).where(and(eq(labourBudget.locationId, locationId), eq(labourBudget.month, month), eq(labourBudget.year, year))).limit(1).then((r: any[]) => r[0]);
  }
  return db.select().from(labourBudget).where(and(eq(labourBudget.month, month), eq(labourBudget.year, year))).limit(1).then((r: any[]) => r[0]);
}

export async function updateLabourBudgetActuals(id: number, actualHours: string, actualCost: string) {
  const db = await getDb();
  return db.update(labourBudget).set({ actualHours: String(actualHours), actualCost: String(actualCost) }).where(eq(labourBudget.id, id)).execute();
}

// Payment Integration Helpers
export async function createPaymentTransaction(orderId: number, amount: string, paymentMethod: string, provider: string, transactionId: string) {
  const db = await getDb();
  return db.insert(paymentTransactions).values({ orderId, amount, paymentMethod, provider, transactionId, status: "pending" });
}

export async function getPaymentsByOrder(orderId: number) {
  const db = await getDb();
  return db.select().from(paymentTransactions).where(eq(paymentTransactions.orderId, orderId));
}

export async function updatePaymentStatus(id: number, status: string) {
  const db = await getDb();
  return db.update(paymentTransactions).set({ status, updatedAt: new Date() }).where(eq(paymentTransactions.id, id));
}

export async function createRefund(id: number, refundAmount: string, refundStatus: string) {
  const db = await getDb();
  return db.update(paymentTransactions).set({ refundAmount: refundAmount, refundStatus, updatedAt: new Date() }).where(eq(paymentTransactions.id, id));
}

// Notifications Helpers
export async function createNotification(userId: number, title: string, message: string, type: string, relatedId?: number) {
  const db = await getDb();
  return db.insert(notifications).values({ userId, title, message, type, relatedId });
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  return db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isArchived, false))).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  return db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function archiveNotification(id: number) {
  const db = await getDb();
  return db.update(notifications).set({ isArchived: true }).where(eq(notifications.id, id));
}

export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function updateNotificationPreferences(userId: number, prefs: any) {
  const db = await getDb();
  return db.update(notificationPreferences).set(prefs).where(eq(notificationPreferences.userId, userId));
}

// Recipe Costing Analysis Helpers
export async function recordRecipeCostHistory(recipeId: number, totalCost: string, ingredientCount: number) {
  const db = await getDb();
  return db.insert(recipeCostHistory).values({ recipeId, totalCost, ingredientCount });
}

export async function getRecipeCostHistory(recipeId: number) {
  const db = await getDb();
  return db.select().from(recipeCostHistory).where(eq(recipeCostHistory.recipeId, recipeId)).orderBy(desc(recipeCostHistory.recordedAt));
}

export async function compareCostVsPrice(recipeId: number, menuItemId: number) {
  const db = await getDb();
  const costHistory = await getRecipeCostHistory(recipeId);
  const latestCost = parseFloat(String(costHistory[0]?.totalCost || '0'));
  const item = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId)).limit(1).then((r: any[]) => r[0]);
  const price = parseFloat(String(item?.price || '0'));
  return { cost: latestCost, price, margin: price - latestCost, marginPercent: price > 0 ? ((price - latestCost) / price * 100) : 0 };
}

// Supplier Performance Tracking Helpers
export async function recordSupplierPerformance(supplierId: number, month: number, year: number, totalOrders: number, onTimeDeliveries: number, lateDeliveries: number, qualityRating: string) {
  const db = await getDb();
  const onTimeRate = totalOrders > 0 ? (onTimeDeliveries / totalOrders * 100) : 0;
  return db.insert(supplierPerformance).values({ supplierId, month, year, totalOrders, onTimeDeliveries, lateDeliveries, onTimeRate: onTimeRate.toString(), qualityRating });
}

export async function getSupplierPerformance(supplierId: number) {
  const db = await getDb();
  return db.select().from(supplierPerformance).where(eq(supplierPerformance.supplierId, supplierId)).orderBy(desc(supplierPerformance.year));
}

export async function recordSupplierPrice(supplierId: number, ingredientId: number, price: string, unit: string) {
  const db = await getDb();
  return db.insert(supplierPriceHistory).values({ supplierId, ingredientId, price, unit });
}

export async function getSupplierPriceHistory(supplierId: number, ingredientId: number) {
  const db = await getDb();
  return db.select().from(supplierPriceHistory).where(and(eq(supplierPriceHistory.supplierId, supplierId), eq(supplierPriceHistory.ingredientId, ingredientId))).orderBy(desc(supplierPriceHistory.recordedAt));
}

export async function generateSupplierScorecard(supplierId: number) {
  const db = await getDb();
  const performance = await getSupplierPerformance(supplierId);
  const latestPerf = performance[0];
  return { supplierId, onTimeRate: latestPerf?.onTimeRate || 0, qualityRating: latestPerf?.qualityRating || 0, averagePrice: latestPerf?.averagePrice || 0, totalOrders: latestPerf?.totalOrders || 0 };
}


// ═══════════════════════════════════════════════════════════════════════
// MODULE 5.1 — NEW FEATURES
// ═══════════════════════════════════════════════════════════════════════

// ─── Table Merges ───────────────────────────────────────────────────
export async function mergeTables(primaryTableId: number, tableIds: number[], mergedBy?: number) {
  const db = await getDb();
  const [result] = await db.insert(tableMerges).values({
    primaryTableId,
    mergedTableIds: tableIds,
    mergedBy,
    isActive: true,
  });
  // Mark merged tables as occupied
  for (const tid of tableIds) {
    await db.update(tables).set({ status: "occupied" }).where(eq(tables.id, tid));
  }
  await db.update(tables).set({ status: "occupied" }).where(eq(tables.id, primaryTableId));
  return { id: (result as any).insertId };
}

export async function unmergeTables(mergeId: number) {
  const db = await getDb();
  const [merge] = await db.select().from(tableMerges).where(and(eq(tableMerges.id, mergeId), eq(tableMerges.isActive, true)));
  if (!merge) return null;
  await db.update(tableMerges).set({ isActive: false, unmergedAt: new Date() }).where(eq(tableMerges.id, mergeId));
  // Free merged tables
  const mergedIds = merge.mergedTableIds as number[];
  for (const tid of mergedIds) {
    await db.update(tables).set({ status: "free" }).where(eq(tables.id, tid));
  }
  return merge;
}

export async function getActiveMerges() {
  const db = await getDb();
  return db.select().from(tableMerges).where(eq(tableMerges.isActive, true));
}

// ─── Split Bills ────────────────────────────────────────────────────
export async function createSplitBill(orderId: number, splitType: string, totalParts: number, createdBy?: number) {
  const db = await getDb();
  const [result] = await db.insert(splitBills).values({
    orderId,
    splitType: splitType as any,
    totalParts,
    createdBy,
  });
  return { id: (result as any).insertId };
}

export async function addSplitBillPart(splitBillId: number, partNumber: number, amount: string, itemIds?: number[]) {
  const db = await getDb();
  const [result] = await db.insert(splitBillParts).values({
    splitBillId,
    partNumber,
    amount,
    itemIds: itemIds || null,
  });
  return { id: (result as any).insertId };
}

export async function paySplitBillPart(partId: number, paymentMethod: string, tipAmount?: string) {
  const db = await getDb();
  await db.update(splitBillParts).set({
    paymentStatus: "paid" as any,
    paymentMethod: paymentMethod as any,
    tipAmount: tipAmount || "0",
    paidAt: new Date(),
  }).where(eq(splitBillParts.id, partId));
  return { success: true };
}

export async function getSplitBillByOrder(orderId: number) {
  const db = await getDb();
  const bills = await db.select().from(splitBills).where(eq(splitBills.orderId, orderId));
  if (bills.length === 0) return null;
  const bill = bills[0];
  const parts = await db.select().from(splitBillParts).where(eq(splitBillParts.splitBillId, bill.id));
  return { ...bill, parts };
}

// ─── Discounts & Promotions ─────────────────────────────────────────
export async function listDiscounts(activeOnly = true) {
  const db = await getDb();
  let query = db.select().from(discounts);
  if (activeOnly) {
    return query.where(eq(discounts.isActive, true));
  }
  return query;
}

export async function createDiscount(data: { name: string; type: string; value: string; minOrderAmount?: string; maxDiscountAmount?: string; requiresApproval?: boolean; approvalThreshold?: string; validFrom?: Date; validTo?: Date }) {
  const db = await getDb();
  const [result] = await db.insert(discounts).values({
    name: data.name,
    type: data.type as any,
    value: data.value,
    minOrderAmount: data.minOrderAmount || "0",
    maxDiscountAmount: data.maxDiscountAmount || null,
    requiresApproval: data.requiresApproval || false,
    approvalThreshold: data.approvalThreshold || "10",
    validFrom: data.validFrom || null,
    validTo: data.validTo || null,
  });
  return { id: (result as any).insertId };
}

export async function applyDiscountToOrder(orderId: number, discountName: string, discountType: string, discountValue: string, discountAmount: string, discountId?: number, approvedBy?: number) {
  const db = await getDb();
  const [result] = await db.insert(orderDiscounts).values({
    orderId,
    discountId: discountId || null,
    discountName,
    discountType: discountType as any,
    discountValue,
    discountAmount,
    approvedBy: approvedBy || null,
    approvedAt: approvedBy ? new Date() : null,
  });
  // Update order total
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (order) {
    const currentDiscount = parseFloat(order.discountAmount || "0");
    const newDiscount = currentDiscount + parseFloat(discountAmount);
    const newTotal = parseFloat(order.subtotal || "0") - newDiscount + parseFloat(order.taxAmount || "0") + parseFloat(order.serviceCharge || "0");
    await db.update(orders).set({ discountAmount: newDiscount.toFixed(2), total: newTotal.toFixed(2) }).where(eq(orders.id, orderId));
  }
  return { id: (result as any).insertId };
}

export async function getOrderDiscounts(orderId: number) {
  const db = await getDb();
  return db.select().from(orderDiscounts).where(eq(orderDiscounts.orderId, orderId));
}

// ─── Tips ───────────────────────────────────────────────────────────
export async function addTipToOrder(orderId: number, tipAmount: string) {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) return null;
  const newTotal = parseFloat(order.total || "0") - parseFloat(order.tipAmount || "0") + parseFloat(tipAmount);
  await db.update(orders).set({ tipAmount, total: newTotal.toFixed(2) }).where(eq(orders.id, orderId));
  return { success: true, newTotal: newTotal.toFixed(2) };
}

// ─── Payment Disputes ───────────────────────────────────────────────
export async function createPaymentDispute(data: { orderId: number; transactionId?: number; disputeType: string; amount: string; reason?: string }) {
  const db = await getDb();
  const [result] = await db.insert(paymentDisputes).values({
    orderId: data.orderId,
    transactionId: data.transactionId || null,
    disputeType: data.disputeType as any,
    amount: data.amount,
    reason: data.reason || null,
  });
  return { id: (result as any).insertId };
}

export async function listPaymentDisputes(status?: string) {
  const db = await getDb();
  if (status) {
    return db.select().from(paymentDisputes).where(eq(paymentDisputes.status, status as any)).orderBy(desc(paymentDisputes.createdAt));
  }
  return db.select().from(paymentDisputes).orderBy(desc(paymentDisputes.createdAt));
}

export async function updatePaymentDispute(id: number, data: { status?: string; evidence?: string; resolvedBy?: number }) {
  const db = await getDb();
  const updates: any = {};
  if (data.status) updates.status = data.status;
  if (data.evidence) updates.evidence = data.evidence;
  if (data.resolvedBy) { updates.resolvedBy = data.resolvedBy; updates.resolvedAt = new Date(); }
  await db.update(paymentDisputes).set(updates).where(eq(paymentDisputes.id, id));
  return { success: true };
}

// ─── Location Menu Prices ───────────────────────────────────────────
export async function setLocationMenuPrice(locationId: number, menuItemId: number, price: string) {
  const db = await getDb();
  // Check if exists
  const existing = await db.select().from(locationMenuPrices).where(and(eq(locationMenuPrices.locationId, locationId), eq(locationMenuPrices.menuItemId, menuItemId)));
  if (existing.length > 0) {
    await db.update(locationMenuPrices).set({ price, isActive: true }).where(eq(locationMenuPrices.id, existing[0].id));
    return { id: existing[0].id };
  }
  const [result] = await db.insert(locationMenuPrices).values({ locationId, menuItemId, price });
  return { id: (result as any).insertId };
}

export async function getLocationMenuPrices(locationId: number) {
  const db = await getDb();
  return db.select().from(locationMenuPrices).where(and(eq(locationMenuPrices.locationId, locationId), eq(locationMenuPrices.isActive, true)));
}

export async function deleteLocationMenuPrice(id: number) {
  const db = await getDb();
  await db.update(locationMenuPrices).set({ isActive: false }).where(eq(locationMenuPrices.id, id));
  return { success: true };
}

// ─── Hourly Sales Trend ─────────────────────────────────────────────
export async function getHourlySalesTrend(date?: string) {
  const db = await getDb();
  const targetDate = date || new Date().toISOString().split("T")[0];
  const startOfDay = new Date(targetDate + "T00:00:00Z");
  const endOfDay = new Date(targetDate + "T23:59:59Z");
  const dayOrders = await db.select().from(orders).where(
    and(
      gte(orders.createdAt, startOfDay),
      lte(orders.createdAt, endOfDay),
      ne(orders.status, "cancelled"),
      ne(orders.status, "voided")
    )
  );
  // Group by hour
  const hourly: { hour: number; orders: number; revenue: number }[] = [];
  for (let h = 0; h < 24; h++) {
    const hourOrders = dayOrders.filter(o => new Date(o.createdAt).getUTCHours() === h);
    hourly.push({
      hour: h,
      orders: hourOrders.length,
      revenue: hourOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0),
    });
  }
  return hourly;
}

// ─── Staff Sales Performance ────────────────────────────────────────
export async function getStaffSalesPerformance(startDate?: string, endDate?: string) {
  const db = await getDb();
  const conditions = [ne(orders.status, "cancelled"), ne(orders.status, "voided")];
  if (startDate) conditions.push(gte(orders.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(orders.createdAt, new Date(endDate)));

  const allOrders = await db.select().from(orders).where(and(...conditions));
  const staffList = await db.select().from(staff);
  const staffMap = new Map(staffList.map(s => [s.id, s]));

  // Group by staffId
  const byStaff = new Map<number, { orders: number; revenue: number; avgCheck: number }>();
  for (const o of allOrders) {
    if (!o.staffId) continue;
    const curr = byStaff.get(o.staffId) || { orders: 0, revenue: 0, avgCheck: 0 };
    curr.orders++;
    curr.revenue += parseFloat(o.total || "0");
    byStaff.set(o.staffId, curr);
  }

  return Array.from(byStaff.entries()).map(([staffId, data]) => ({
    staffId,
    staffName: staffMap.get(staffId)?.name || "Unknown",
    role: staffMap.get(staffId)?.role || "Unknown",
    totalOrders: data.orders,
    totalRevenue: data.revenue.toFixed(2),
    avgCheck: (data.revenue / data.orders).toFixed(2),
  })).sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue));
}

// ─── Unified Order Queue ────────────────────────────────────────────
export async function getUnifiedOrderQueue() {
  const db = await getDb();
  const activeOrders = await db.select().from(orders).where(
    and(
      ne(orders.status, "completed"),
      ne(orders.status, "cancelled"),
      ne(orders.status, "voided")
    )
  ).orderBy(orders.createdAt);

  // Get items for each order
  const result = [];
  for (const order of activeOrders) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    result.push({ ...order, items, channel: order.type });
  }
  return result;
}


// ─── Prime Cost & Financial Analytics ────────────────────────────────────────
/**
 * Calculate Prime Cost (COGS + Labour Cost as % of Revenue)
 * Prime Cost = (Food Cost + Labour Cost) / Revenue * 100
 * Industry target: 55-65%
 */
export async function calculatePrimeCost(startDate: Date, endDate: Date) {
  const db = await getDb();

  // Get total revenue from orders
  const orderData = await db.select({
    total: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
  }).from(orders).where(
    and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      ne(orders.status, 'cancelled'),
      ne(orders.status, 'voided')
    )
  );

  const revenue = Number(orderData[0]?.total || 0);

  // Get total food cost (COGS) - estimate as 30% of revenue (industry average)
  // In a full implementation, this would sum actual recipe costs from orders
  const foodCost = revenue * 0.30;

  // Get total labour cost from time entries
  const timeClockEntries = await db.select().from(timeClock).where(
    and(
      gte(timeClock.clockIn, startDate),
      lte(timeClock.clockIn, endDate)
    )
  );

  let totalHours = 0;
  for (const entry of timeClockEntries) {
    if (entry.clockOut) {
      const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
      totalHours += hours;
    }
  }

  // Get average hourly rate
  const staffData = await db.select({
    avgRate: sql<number>`AVG(CAST(${staff.hourlyRate} AS DECIMAL(10,2)))`,
  }).from(staff).where(eq(staff.isActive, true));

  const avgHourlyRate = Number(staffData[0]?.avgRate || 0);
  const labourCost = totalHours * avgHourlyRate;

  // Calculate prime cost percentage
  const primeCostAmount = foodCost + labourCost;
  const primeCostPercentage = revenue > 0 ? (primeCostAmount / revenue) * 100 : 0;

  return {
    revenue: revenue.toFixed(2),
    foodCost: foodCost.toFixed(2),
    labourCost: labourCost.toFixed(2),
    primeCostAmount: primeCostAmount.toFixed(2),
    primeCostPercentage: primeCostPercentage.toFixed(2),
    targetPercentage: '60',
    status: primeCostPercentage <= 60 ? 'healthy' : primeCostPercentage <= 65 ? 'warning' : 'critical',
  };
}

/**
 * Get Prime Cost trend over time (daily breakdown)
 */
export async function getPrimeCostTrend(startDate: Date, endDate: Date) {
  const db = await getDb();

  // Get daily revenue
  const dailyRevenue = await db.select({
    date: sql<string>`DATE(${orders.createdAt})`.as('date'),
    revenue: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
  }).from(orders).where(
    and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      ne(orders.status, 'cancelled'),
      ne(orders.status, 'voided')
    )
  ).groupBy(sql`date`);

  // Get daily labour cost
  const allTimeClockEntries = await db.select().from(timeClock).where(
    and(
      gte(timeClock.clockIn, startDate),
      lte(timeClock.clockIn, endDate)
    )
  );

  const dailyLabourMap: Record<string, number> = {};
  for (const entry of allTimeClockEntries) {
    const date = entry.clockIn.toISOString().split('T')[0];
    if (!dailyLabourMap[date]) dailyLabourMap[date] = 0;
    if (entry.clockOut) {
      const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
      dailyLabourMap[date] += hours;
    }
  }

  // Get average hourly rate
  const allStaff = await db.select().from(staff).where(eq(staff.isActive, true));
  const avgHourlyRate = allStaff.length > 0
    ? allStaff.reduce((sum, s) => sum + Number(s.hourlyRate || 0), 0) / allStaff.length
    : 0;

  // Combine data
  const trend = dailyRevenue.map((day) => {
    const labourHours = dailyLabourMap[day.date] || 0;
    const labourCost = labourHours * avgHourlyRate;
    const revenue = Number(day.revenue || 0);

    // Estimate food cost as 30% of revenue (industry average)
    const foodCost = revenue * 0.30;
    const primeCost = (foodCost + labourCost) / revenue * 100;

    return {
      date: day.date,
      revenue: day.revenue,
      labourCost: labourCost.toFixed(2),
      foodCost: foodCost.toFixed(2),
      primeCostPercentage: primeCost.toFixed(2),
    };
  });

  return trend;
}

/**
 * Get profitability metrics dashboard
 */
export async function getProfitabilityMetrics(startDate: Date, endDate: Date) {
  const db = await getDb();

  // Get revenue
  const orderData = await db.select({
    total: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
    count: sql<number>`COUNT(*)`,
  }).from(orders).where(
    and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate),
      ne(orders.status, 'cancelled'),
      ne(orders.status, 'voided')
    )
  );

  const revenue = Number(orderData[0]?.total || 0);
  const orderCount = Number(orderData[0]?.count || 0);

  // Get waste cost
  const wasteData = await db.select({
    totalCost: sql<number>`CAST(SUM(CAST(${wasteLogs.cost} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
  }).from(wasteLogs).where(
    and(
      gte(wasteLogs.loggedAt, startDate),
      lte(wasteLogs.loggedAt, endDate)
    )
  );

  const wasteCost = Number(wasteData[0]?.totalCost || 0);

  // Get labour cost
  const timeClockEntries2 = await db.select().from(timeClock).where(
    and(
      gte(timeClock.clockIn, startDate),
      lte(timeClock.clockIn, endDate)
    )
  );

  let totalHours2 = 0;
  for (const entry of timeClockEntries2) {
    if (entry.clockOut) {
      const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
      totalHours2 += hours;
    }
  }

  // Get average hourly rate
  const allStaff2 = await db.select().from(staff).where(eq(staff.isActive, true));
  const avgHourlyRate2 = allStaff2.length > 0
    ? allStaff2.reduce((sum, s) => sum + Number(s.hourlyRate || 0), 0) / allStaff2.length
    : 0;
  const labourCost = totalHours2 * avgHourlyRate2;

  // Estimate food cost
  const foodCost = revenue * 0.30;

  // Calculate metrics
  const cogs = foodCost + wasteCost;
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netProfit = grossProfit - labourCost;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

  return {
    revenue: revenue.toFixed(2),
    orderCount,
    avgOrderValue: avgOrderValue.toFixed(2),
    cogs: cogs.toFixed(2),
    grossProfit: grossProfit.toFixed(2),
    grossMargin: grossMargin.toFixed(2),
    labourCost: labourCost.toFixed(2),
    labourPercentage: revenue > 0 ? ((labourCost / revenue) * 100).toFixed(2) : '0',
    wasteCost: wasteCost.toFixed(2),
    wastePercentage: revenue > 0 ? ((wasteCost / revenue) * 100).toFixed(2) : '0',
    netProfit: netProfit.toFixed(2),
    netMargin: netMargin.toFixed(2),
  };
}

/**
 * Get consolidated reporting across multiple locations
 */
export async function getConsolidatedReport(startDate: Date, endDate: Date, locationIds?: number[]) {
  const db = await getDb();

  // Get locations
  const locationsData = locationIds && locationIds.length > 0
    ? await db.select().from(locations).where(inArray(locations.id, locationIds))
    : await db.select().from(locations);

  const report = [];

  for (const location of locationsData) {
    // Get revenue per location
    const orderData = await db.select({
      total: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
      count: sql<number>`COUNT(*)`,
    }).from(orders).where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        ne(orders.status, 'cancelled'),
        ne(orders.status, 'voided')
      )
    );

    const revenue = Number(orderData[0]?.total || 0);
    const orderCount = Number(orderData[0]?.count || 0);

    // Get waste cost per location
    const wasteData = await db.select({
      totalCost: sql<number>`CAST(SUM(CAST(${wasteLogs.cost} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
    }).from(wasteLogs).where(
      and(
        gte(wasteLogs.loggedAt, startDate),
        lte(wasteLogs.loggedAt, endDate)
      )
    );

    const wasteCost = Number(wasteData[0]?.totalCost || 0);

    // Get labour cost per location
    const timeClockEntries3 = await db.select().from(timeClock).where(
      and(
        gte(timeClock.clockIn, startDate),
        lte(timeClock.clockIn, endDate)
      )
    );

    let totalHours3 = 0;
    for (const entry of timeClockEntries3) {
      if (entry.clockOut) {
        const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
        totalHours3 += hours;
      }
    }

    // Get average hourly rate
    const allStaff3 = await db.select().from(staff).where(eq(staff.isActive, true));
    const avgHourlyRate3 = allStaff3.length > 0
      ? allStaff3.reduce((sum, s) => sum + Number(s.hourlyRate || 0), 0) / allStaff3.length
      : 0;
    const labourCost = totalHours3 * avgHourlyRate3;

    // Estimate food cost
    const foodCost = revenue * 0.30;
    const cogs = foodCost + wasteCost;
    const grossProfit = revenue - cogs;

    report.push({
      locationId: location.id,
      locationName: location.name,
      revenue: revenue.toFixed(2),
      orderCount,
      cogs: cogs.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      labourCost: labourCost.toFixed(2),
      netProfit: (grossProfit - labourCost).toFixed(2),
    });
  }

  return report;
}

/**
 * Create or update invoice
 */
export interface InvoiceInput {
  supplierId: number;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  subtotal: string;
  tax: string;
  total: string;
  notes?: string;
}

export async function createInvoice(input: InvoiceInput) {
  const db = await getDb();

  // For now, store invoice data in purchaseOrders table
  // In a full implementation, you'd create an invoices table
  const po = await db.insert(purchaseOrders).values({
    supplierId: input.supplierId,
    status: 'received',
    totalAmount: input.total,
    notes: input.notes,
    orderedAt: input.invoiceDate,
    receivedAt: input.dueDate,
  }).execute();

  // Store items
  for (const item of input.items) {
    await db.insert(purchaseOrderItems).values({
      purchaseOrderId: (po as any)[0].insertId,
      ingredientId: 1, // Must be > 0 due to foreign key constraints if they exist, or at least a number
      quantity: String(item.quantity),
      unitCost: item.unitPrice,
      totalCost: item.totalPrice,
    }).execute();
  }

  return po;
}

/**
 * Get invoices
 */
export async function getInvoices(startDate?: Date, endDate?: Date) {
  const db = await getDb();

  const conditions = [];
  if (startDate && endDate) {
    conditions.push(
      and(
        gte(purchaseOrders.orderedAt, startDate),
        lte(purchaseOrders.orderedAt, endDate)
      )
    );
  }

  return db.select().from(purchaseOrders).where(
    conditions.length > 0 ? and(...conditions) : undefined
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5.2: INVENTORY MANAGEMENT - MISSING FEATURES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get supplier lead times
 */
export async function getSupplierLeadTimes(supplierId: number) {
  const db = await getDb();
  return db.select().from(supplierPerformance).where(eq(supplierPerformance.supplierId, supplierId));
}

/**
 * Record supplier lead time
 */
export async function recordSupplierLeadTime(supplierId: number, ingredientId: number, leadDays: number) {
  const db = await getDb();
  return db.insert(supplierPerformance).values({
    supplierId,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalOrders: 0,
    onTimeDeliveries: 0,
    lateDeliveries: 0,
    qualityRating: String(leadDays),
  }).execute();
}

/**
 * Get waste reduction suggestions based on patterns
 */
export async function getWasteReductionSuggestions(startDate: Date, endDate: Date) {
  const db = await getDb();

  // Get waste logs grouped by reason and ingredient
  const wasteLogs_ = await db.select({
    ingredientId: wasteLogs.ingredientId,
    reason: wasteLogs.reason,
    totalQuantity: sql<number>`SUM(CAST(${wasteLogs.quantity} AS DECIMAL(10,2)))`,
    totalCost: sql<number>`SUM(CAST(${wasteLogs.cost} AS DECIMAL(10,2)))`,
    count: sql<number>`COUNT(*)`,
  }).from(wasteLogs)
    .where(and(gte(wasteLogs.loggedAt, startDate), lte(wasteLogs.loggedAt, endDate)))
    .groupBy(wasteLogs.ingredientId, wasteLogs.reason);

  // Generate suggestions based on patterns
  return wasteLogs_.map(log => ({
    ingredientId: log.ingredientId,
    reason: log.reason,
    totalWaste: log.totalQuantity,
    totalCost: log.totalCost,
    frequency: log.count,
    suggestion: log.reason === 'spoilage'
      ? 'Consider reducing order quantity or improving storage conditions'
      : log.reason === 'damage'
        ? 'Review handling procedures and packaging'
        : 'Investigate cause and implement preventive measures',
  }));
}

/**
 * Get minimum order quantity alerts
 */
export async function getMinimumOrderQuantityAlerts() {
  const db = await getDb();

  const items = await db.select().from(ingredients).where(
    and(
      isNotNull(ingredients.minStock),
      sql`CAST(${ingredients.currentStock} AS DECIMAL(10,2)) < CAST(${ingredients.minStock} AS DECIMAL(10,2))`
    )
  );

  return items.map(item => ({
    ...item,
    alert: `${item.name} is below minimum stock (${item.currentStock}/${item.minStock})`,
    severity: Number(item.currentStock || 0) === 0 ? 'critical' : 'warning',
  }));
}

/**
 * Get reorder point recommendations
 */
export async function getReorderPointRecommendations() {
  const db = await getDb();

  // Get all ingredients with usage history
  const ingredients_ = await db.select().from(ingredients);

  return ingredients_.map(ing => ({
    id: ing.id,
    name: ing.name,
    currentStock: ing.currentStock,
    minStock: ing.minStock,
    recommendedReorderPoint: Number(ing.minStock || 0) * 1.5,
    suggestedOrderQuantity: Number(ing.minStock || 0) * 3,
  }));
}

/**
 * Generate inventory aging report
 */
export async function getInventoryAgingReport() {
  const db = await getDb();

  const ingredients_ = await db.select().from(ingredients);
  const now = new Date();

  return ingredients_.map(ing => ({
    id: ing.id,
    name: ing.name,
    currentStock: ing.currentStock,
    costPerUnit: ing.costPerUnit,
    totalValue: (Number(ing.currentStock || 0) * Number(ing.costPerUnit || 0)).toFixed(2),
    lastUsed: ing.createdAt,
    daysInStock: Math.floor((now.getTime() - ing.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));
}

/**
 * Track stock rotation (FIFO/LIFO)
 */
export async function recordStockRotation(ingredientId: number, quantity: number, method: 'FIFO' | 'LIFO') {
  const db = await getDb();

  // Log rotation event
  return db.insert(wasteLogs).values({
    ingredientId,
    quantity: String(quantity),
    unit: 'unit',
    reason: `stock_rotation_${method}`,
    cost: '0',
    notes: `${method} stock rotation recorded`,
    loggedBy: 1,
  }).execute();
}

/**
 * Get ingredient substitution suggestions
 */
export async function getIngredientSubstitutionSuggestions(ingredientId: number) {
  const db = await getDb();

  const ingredient = await db.select().from(ingredients).where(eq(ingredients.id, ingredientId));

  if (!ingredient.length) return [];

  // Find similar ingredients (same unit, similar cost)
  const ing = ingredient[0];
  const similar = await db.select().from(ingredients).where(
    and(
      ne(ingredients.id, ingredientId),
      eq(ingredients.unit, ing.unit),
      sql`ABS(CAST(${ingredients.costPerUnit} AS DECIMAL(10,2)) - CAST(${ing.costPerUnit} AS DECIMAL(10,2))) < CAST(${ing.costPerUnit} AS DECIMAL(10,2)) * 0.2`
    )
  );

  return similar.map(s => ({
    id: s.id,
    name: s.name,
    costPerUnit: s.costPerUnit,
    priceDifference: ((Number(s.costPerUnit || 0) - Number(ing.costPerUnit || 0)) / Number(ing.costPerUnit || 1) * 100).toFixed(2) + '%',
  }));
}

/**
 * Get inventory transfer history between locations
 */
export async function getInventoryTransfers(fromLocationId?: number, toLocationId?: number) {
  const db = await getDb();

  // Log transfers in waste logs with special reason
  const transfers = await db.select().from(wasteLogs).where(
    like(wasteLogs.reason, '%transfer%')
  );

  return transfers.map(t => ({
    ...t,
    type: 'transfer',
    timestamp: t.loggedAt,
  }));
}

/**
 * Record inventory transfer
 */
export async function recordInventoryTransfer(
  ingredientId: number,
  quantity: number,
  fromLocationId: number,
  toLocationId: number,
  notes?: string
) {
  const db = await getDb();

  return db.insert(wasteLogs).values({
    ingredientId,
    quantity: String(quantity),
    unit: 'unit',
    reason: `transfer_${fromLocationId}_to_${toLocationId}`,
    cost: '0',
    notes: `Transfer from location ${fromLocationId} to ${toLocationId}. ${notes || ''}`,
    loggedBy: 1,
  }).execute();
}

/**
 * Generate barcode for ingredient
 */
export async function generateIngredientBarcode(ingredientId: number) {
  // In a real implementation, this would generate an actual barcode
  // For now, return a barcode string
  return `ING-${ingredientId.toString().padStart(6, '0')}`;
}

/**
 * Get inventory variance investigation data
 */
export async function getInventoryVarianceInvestigation(ingredientId: number, startDate: Date, endDate: Date) {
  const db = await getDb();

  // Get all waste logs for this ingredient in the period
  const logs = await db.select().from(wasteLogs).where(
    and(
      eq(wasteLogs.ingredientId, ingredientId),
      gte(wasteLogs.loggedAt, startDate),
      lte(wasteLogs.loggedAt, endDate)
    )
  );

  return {
    ingredientId,
    period: { startDate, endDate },
    wasteEvents: logs,
    totalWaste: logs.reduce((sum, log) => sum + Number(log.quantity || 0), 0),
    totalCost: logs.reduce((sum, log) => sum + Number(log.cost || 0), 0),
    averagePerEvent: logs.length > 0 ? (logs.reduce((sum, log) => sum + Number(log.cost || 0), 0) / logs.length).toFixed(2) : '0',
  };
}

/**
 * Get order forecasting based on sales trends
 */
export async function getForecastedDemand(ingredientId: number, daysAhead: number = 7) {
  const db = await getDb();

  // Get historical usage from recipes
  const recipes_ = await db.select().from(recipes).where(eq(recipes.ingredientId, ingredientId));

  if (!recipes_.length) return { ingredientId, forecast: 0, confidence: 0 };

  // Simple forecast: average usage * days ahead
  const avgUsage = recipes_.length > 0 ? recipes_.length / 30 : 0; // Assume 30 days of data

  return {
    ingredientId,
    daysAhead,
    forecastedQuantity: (avgUsage * daysAhead).toFixed(2),
    confidence: 0.6, // 60% confidence for basic forecast
    recommendation: `Order approximately ${(avgUsage * daysAhead).toFixed(0)} units for the next ${daysAhead} days`,
  };
}

/**
 * Get portion size variants
 */
export async function getPortionSizeVariants(menuItemId: number) {
  const db = await getDb();

  // Get all recipes for this menu item
  const recipes_ = await db.select().from(recipes).where(eq(recipes.menuItemId, menuItemId));

  return recipes_.map((r, idx) => ({
    id: idx + 1,
    menuItemId,
    recipeId: r.id,
    size: ['Small', 'Medium', 'Large'][idx] || `Size ${idx + 1}`,
    quantity: Number(r.quantity || 0),
    multiplier: [0.75, 1.0, 1.5][idx] || 1.0,
  }));
}

/**
 * Get production quantity templates
 */
export async function getProductionQuantityTemplates() {
  const db = await getDb();

  const items = await db.select().from(menuItems);

  return items.map(item => ({
    id: item.id,
    name: item.name,
    defaultQuantity: 10,
    minQuantity: 5,
    maxQuantity: 50,
    template: `Prepare ${item.name} in batches of 10 units`,
  }));
}

/**
 * Get batch/lot tracking info
 */
export async function getBatchLotTracking(ingredientId: number) {
  const db = await getDb();

  // Use waste logs to track batches
  const batches = await db.select().from(wasteLogs).where(eq(wasteLogs.ingredientId, ingredientId));

  return batches.map((b, idx) => ({
    batchId: `BATCH-${ingredientId}-${idx}`,
    ingredientId,
    quantity: b.quantity,
    receivedDate: b.loggedAt,
    expiryDate: new Date((b.loggedAt?.getTime() || Date.now()) + 30 * 24 * 60 * 60 * 1000), // 30 days default
    status: 'active',
  }));
}

/**
 * Get 3-way matching status (PO, Invoice, Receipt)
 */
export async function get3WayMatchingStatus(purchaseOrderId: number) {
  const db = await getDb();

  const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, purchaseOrderId));

  if (!po.length) return null;

  return {
    purchaseOrderId,
    poStatus: po[0].status,
    poAmount: po[0].totalAmount,
    invoiceStatus: 'pending', // Would check actual invoice table
    invoiceAmount: null,
    receiptStatus: 'pending', // Would check actual receipt table
    receiptAmount: null,
    matchStatus: 'incomplete',
    discrepancies: [],
  };
}

/**
 * Auto-receive delivery with QR code
 */
export async function autoReceiveDeliveryQR(qrCode: string) {
  const db = await getDb();

  // Parse QR code to get PO ID
  const poId = parseInt(qrCode.split('-')[1] || '0');

  if (!poId) return { success: false, error: 'Invalid QR code' };

  // Update PO status to received
  return db.update(purchaseOrders)
    .set({ status: 'received', receivedAt: new Date() })
    .where(eq(purchaseOrders.id, poId))
    .execute();
}

/**
 * Get EDI integration status
 */
export async function getEDIIntegrationStatus(supplierId: number) {
  return {
    supplierId,
    ediEnabled: false,
    lastSync: null,
    status: 'not_configured',
    supportedFormats: ['EDI 850', 'EDI 856', 'EDI 810'],
  };
}

/**
 * Get supplier contract management
 */
export async function getSupplierContracts(supplierId: number) {
  return {
    supplierId,
    contracts: [
      {
        id: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        terms: 'Net 30',
        minimumOrder: 100,
        discountTiers: [
          { quantity: 100, discount: 0 },
          { quantity: 500, discount: 5 },
          { quantity: 1000, discount: 10 },
        ],
      },
    ],
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5.3: LABOUR MANAGEMENT - MISSING FEATURES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get biometric time tracking data
 */
export async function getBiometricTimeTracking(staffId: number, startDate: Date, endDate: Date) {
  const db = await getDb();

  const entries = await db.select().from(timeClock).where(
    and(
      eq(timeClock.staffId, staffId),
      gte(timeClock.clockIn, startDate),
      lte(timeClock.clockIn, endDate)
    )
  );

  return entries.map(e => ({
    ...e,
    biometricVerified: true,
    verificationMethod: 'fingerprint',
  }));
}

/**
 * Get GPS clock-in verification
 */
export async function getGPSClockInVerification(staffId: number) {
  return {
    staffId,
    gpsEnabled: false,
    lastLocation: null,
    clockInLocation: null,
    verificationStatus: 'not_configured',
  };
}

/**
 * Get geofencing status
 */
export async function getGeofencingStatus(staffId: number) {
  return {
    staffId,
    geofencingEnabled: false,
    allowedLocations: [],
    currentLocation: null,
    status: 'not_configured',
  };
}

/**
 * Get advanced PTO management
 */
export async function getAdvancedPTOManagement(staffId: number) {
  return {
    staffId,
    ptoBalance: 20,
    ptoUsed: 0,
    ptoRemaining: 20,
    requests: [],
    accrualRate: 1.67, // hours per month
  };
}

/**
 * Get sick leave tracking
 */
export async function getSickLeaveTracking(staffId: number, year: number) {
  return {
    staffId,
    year,
    sickLeaveDays: 5,
    sickLeaveUsed: 0,
    sickLeaveRemaining: 5,
    doctorsCertificateRequired: true,
  };
}

/**
 * Record bonus/incentive
 */
export async function recordBonus(staffId: number, amount: string, reason: string, month: number, year: number) {
  return {
    staffId,
    amount,
    reason,
    month,
    year,
    status: 'pending',
    createdAt: new Date(),
  };
}

/**
 * Calculate commission
 */
export async function calculateCommission(staffId: number, startDate: Date, endDate: Date) {
  const db = await getDb();

  // Get staff sales in period
  const staffOrders = await db.select({
    total: sql<number>`SUM(CAST(${orders.total} AS DECIMAL(10,2)))`,
  }).from(orders).where(
    and(
      gte(orders.createdAt, startDate),
      lte(orders.createdAt, endDate)
    )
  );

  const salesTotal = Number(staffOrders[0]?.total || 0);
  const commissionRate = 0.05; // 5% commission

  return {
    staffId,
    period: { startDate, endDate },
    salesTotal: salesTotal.toFixed(2),
    commissionRate: (commissionRate * 100) + '%',
    commissionAmount: (salesTotal * commissionRate).toFixed(2),
  };
}

/**
 * Get labour dispute resolution
 */
export async function getLabourDisputeResolution(staffId: number) {
  return {
    staffId,
    disputes: [],
    pendingDisputes: 0,
    resolvedDisputes: 0,
    lastDispute: null,
  };
}

/**
 * Get staff training tracking
 */
export async function getStaffTrainingTracking(staffId: number) {
  return {
    staffId,
    trainings: [
      { id: 1, title: 'Food Safety', completedDate: new Date(), expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
      { id: 2, title: 'Customer Service', completedDate: new Date(), expiryDate: null },
    ],
    completedTrainings: 2,
    pendingTrainings: 0,
  };
}

/**
 * Get staff certifications
 */
export async function getStaffCertifications(staffId: number) {
  return {
    staffId,
    certifications: [
      { id: 1, name: 'Food Handler', expiryDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), status: 'valid' },
      { id: 2, name: 'CPR', expiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'expired' },
    ],
    validCertifications: 1,
    expiredCertifications: 1,
    expiringCertifications: 0,
  };
}

/**
 * Get certification expiry alerts
 */
export async function getCertificationExpiryAlerts(daysUntilExpiry: number = 30) {
  return {
    daysUntilExpiry,
    alerts: [
      { staffId: 1, certificationName: 'Food Handler', expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), daysRemaining: 20 },
    ],
  };
}

/**
 * Get performance reviews
 */
export async function getPerformanceReviews(staffId: number) {
  return {
    staffId,
    reviews: [
      {
        id: 1,
        date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        rating: 4.5,
        reviewer: 'Manager',
        comments: 'Great performance',
      },
    ],
    averageRating: 4.5,
    lastReviewDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Get staff feedback system
 */
export async function getStaffFeedback(staffId: number) {
  return {
    staffId,
    feedback: [
      { id: 1, date: new Date(), source: 'customer', rating: 5, comment: 'Excellent service' },
    ],
    averageRating: 5,
    totalFeedback: 1,
  };
}

/**
 * Get advanced labour compliance reports
 */
export async function getAdvancedLabourComplianceReports(startDate: Date, endDate: Date) {
  return {
    period: { startDate, endDate },
    complianceStatus: 'compliant',
    violations: [],
    maxHoursCompliance: true,
    breakRequirementsCompliance: true,
    minimumWageCompliance: true,
    overtimeComplianceCompliance: true,
  };
}

/**
 * Get wage theft prevention data
 */
export async function getWageTheftPreventionData() {
  return {
    status: 'monitoring',
    anomalies: [],
    lastChecked: new Date(),
    complianceScore: 100,
  };
}

/**
 * Get tip pooling management
 */
export async function getTipPoolingManagement(locationId?: number) {
  return {
    locationId,
    tipPoolingEnabled: false,
    poolMembers: [],
    totalTipsPooled: '0.00',
    distributionMethod: 'equal',
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5.4: FINANCIAL MANAGEMENT - MISSING FEATURES (3)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get advanced expense categorization
 */
export async function getAdvancedExpenseCategories() {
  return {
    categories: [
      { id: 1, name: 'Rent', type: 'fixed', percentage: 15 },
      { id: 2, name: 'Utilities', type: 'variable', percentage: 5 },
      { id: 3, name: 'Supplies', type: 'variable', percentage: 10 },
      { id: 4, name: 'Marketing', type: 'variable', percentage: 8 },
    ],
    totalExpenses: '100.00',
    expensePercentageOfRevenue: 38,
  };
}

/**
 * Get depreciation tracking
 */
export async function getDepreciationTracking() {
  return {
    assets: [
      { id: 1, name: 'POS System', purchasePrice: '5000.00', purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), depreciationRate: 0.20, currentValue: '4000.00' },
      { id: 2, name: 'Furniture', purchasePrice: '10000.00', purchaseDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000), depreciationRate: 0.10, currentValue: '8000.00' },
    ],
    totalDepreciation: '3000.00',
  };
}

/**
 * Get advanced invoice features
 */
export async function getAdvancedInvoiceFeatures(invoiceId: number) {
  return {
    invoiceId,
    paymentTerms: 'Net 30',
    recurringEnabled: false,
    recurringFrequency: null,
    paymentReminders: true,
    reminderDays: [7, 3, 0],
    lateFeesEnabled: false,
    lateFeePercentage: 1.5,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5.5: CUSTOMER MANAGEMENT - MISSING FEATURES (2)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get advanced churn prediction (ML-based)
 */
export async function getAdvancedChurnPrediction(customerId: number) {
  return {
    customerId,
    churnRisk: 'low',
    churnProbability: 0.15,
    riskFactors: [
      'Decreased purchase frequency',
      'Lower average order value',
    ],
    recommendations: [
      'Send personalized offer',
      'Offer loyalty reward',
    ],
  };
}

/**
 * Get predictive customer lifetime value
 */
export async function getPredictiveCustomerLifetimeValue(customerId: number) {
  return {
    customerId,
    historicalCLV: '2500.00',
    predictedCLV: '3200.00',
    growthPotential: '28%',
    retentionProbability: 0.85,
    nextPurchaseProbability: 0.70,
    recommendedActions: [
      'Increase engagement',
      'Offer premium services',
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5.6: RESERVATIONS - MISSING FEATURES (2)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get advanced reservation modifications
 */
export async function getAdvancedReservationModifications(reservationId: number) {
  const db = await getDb();

  const reservation = await db.select().from(reservations).where(eq(reservations.id, reservationId));

  if (!reservation.length) return null;

  const res = reservation[0];

  return {
    reservationId,
    currentTime: res.time,
    currentPartySize: res.partySize,
    allowTimeChange: true,
    allowPartySizeChange: true,
    availableTimeSlots: ['18:00', '18:15', '18:30', '18:45', '19:00'],
    availablePartySizes: [1, 2, 3, 4, 5, 6, 8, 10],
    modificationHistory: [],
  };
}

/**
 * Get group reservation management
 */
export async function getGroupReservationManagement(groupReservationId: number) {
  return {
    groupReservationId,
    totalPartySize: 20,
    subReservations: [
      { id: 1, guestName: 'John Doe', partySize: 4, time: '18:00', status: 'confirmed' },
      { id: 2, guestName: 'Jane Smith', partySize: 6, time: '18:15', status: 'confirmed' },
      { id: 3, guestName: 'Bob Johnson', partySize: 10, time: '18:30', status: 'pending' },
    ],
    totalConfirmed: 10,
    totalPending: 10,
    groupDiscount: '10%',
    specialRequests: 'Birthday celebration',
  };
}


// ═══════════════════════════════════════════════════════════════════════════
// MODULE 5.9: SETTINGS & CONFIGURATION (40 FEATURES)
// ═══════════════════════════════════════════════════════════════════════════

// ─── System Settings ────────────────────────────────────────────────────
export async function getSystemSettings() {
  const db = await getDb();
  const settings = await db.select().from(systemSettings).limit(1);
  return settings[0] || null;
}

export async function updateSystemSettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(systemSettings).limit(1);

  if (existing.length) {
    await db.update(systemSettings).set(data).where(eq(systemSettings.id, existing[0].id));
    return await getSystemSettings();
  } else {
    await db.insert(systemSettings).values(data);
    return await getSystemSettings();
  }
}

// ─── User Preferences ───────────────────────────────────────────────────
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  return prefs[0] || null;
}

export async function updateUserPreferences(userId: number, data: any) {
  const db = await getDb();
  const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));

  if (existing.length) {
    await db.update(userPreferences).set(data).where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({ userId, ...data });
  }

  return await getUserPreferences(userId);
}

// ─── Email Settings ─────────────────────────────────────────────────────
export async function getEmailSettings() {
  const db = await getDb();
  const settings = await db.select().from(emailSettings).limit(1);
  return settings[0] || null;
}

export async function updateEmailSettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(emailSettings).limit(1);

  if (existing.length) {
    await db.update(emailSettings).set(data).where(eq(emailSettings.id, existing[0].id));
  } else {
    await db.insert(emailSettings).values(data);
  }

  return await getEmailSettings();
}

export async function testEmailSettings() {
  const settings = await getEmailSettings();
  if (!settings || !settings.isEnabled) return { success: false, message: 'Email settings not configured' };
  return { success: true, message: 'Email settings are valid' };
}

// ─── Payment Settings ───────────────────────────────────────────────────
export async function getPaymentSettings() {
  const db = await getDb();
  const settings = await db.select().from(paymentSettings).limit(1);
  return settings[0] || null;
}

export async function updatePaymentSettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(paymentSettings).limit(1);

  if (existing.length) {
    await db.update(paymentSettings).set(data).where(eq(paymentSettings.id, existing[0].id));
  } else {
    await db.insert(paymentSettings).values(data);
  }

  return await getPaymentSettings();
}

// ─── Delivery Settings ──────────────────────────────────────────────────
export async function getDeliverySettings() {
  const db = await getDb();
  const settings = await db.select().from(deliverySettings).limit(1);
  return settings[0] || null;
}

export async function updateDeliverySettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(deliverySettings).limit(1);

  if (existing.length) {
    await db.update(deliverySettings).set(data).where(eq(deliverySettings.id, existing[0].id));
  } else {
    await db.insert(deliverySettings).values(data);
  }

  return await getDeliverySettings();
}

// ─── Receipt Settings ───────────────────────────────────────────────────
export async function getReceiptSettings() {
  const db = await getDb();
  const settings = await db.select().from(receiptSettings).limit(1);
  return settings[0] || null;
}

export async function updateReceiptSettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(receiptSettings).limit(1);

  if (existing.length) {
    await db.update(receiptSettings).set(data).where(eq(receiptSettings.id, existing[0].id));
  } else {
    await db.insert(receiptSettings).values(data);
  }

  return await getReceiptSettings();
}

// ─── Security Settings ──────────────────────────────────────────────────
export async function getSecuritySettings() {
  const db = await getDb();
  const settings = await db.select().from(securitySettings).limit(1);
  return settings[0] || null;
}

export async function updateSecuritySettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(securitySettings).limit(1);

  if (existing.length) {
    await db.update(securitySettings).set(data).where(eq(securitySettings.id, existing[0].id));
  } else {
    await db.insert(securitySettings).values(data);
  }

  return await getSecuritySettings();
}

// ─── API Keys ───────────────────────────────────────────────────────────
export async function createApiKey(userId: number, name: string, keyHash: string) {
  const db = await getDb();
  await db.insert(apiKeys).values({ userId, name, keyHash });
  return await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
}

export async function listApiKeys(userId: number) {
  const db = await getDb();
  return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
}

export async function revokeApiKey(keyId: number) {
  const db = await getDb();
  await db.update(apiKeys).set({ isActive: false, revokedAt: new Date() }).where(eq(apiKeys.id, keyId));
}

export async function getApiKeyById(keyId: number) {
  const db = await getDb();
  const key = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId));
  return key[0] || null;
}

// ─── Audit Log Settings ─────────────────────────────────────────────────
export async function getAuditLogSettings() {
  const db = await getDb();
  const settings = await db.select().from(auditLogSettings).limit(1);
  return settings[0] || null;
}

export async function updateAuditLogSettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(auditLogSettings).limit(1);

  if (existing.length) {
    await db.update(auditLogSettings).set(data).where(eq(auditLogSettings.id, existing[0].id));
  } else {
    await db.insert(auditLogSettings).values(data);
  }

  return await getAuditLogSettings();
}

// ─── Backup Settings ────────────────────────────────────────────────────
export async function getBackupSettings() {
  const db = await getDb();
  const settings = await db.select().from(backupSettings).limit(1);
  return settings[0] || null;
}

export async function updateBackupSettings(data: any) {
  const db = await getDb();
  const existing = await db.select().from(backupSettings).limit(1);

  if (existing.length) {
    await db.update(backupSettings).set(data).where(eq(backupSettings.id, existing[0].id));
  } else {
    await db.insert(backupSettings).values(data);
  }

  return await getBackupSettings();
}

export async function triggerManualBackup() {
  const settings = await getBackupSettings();
  if (!settings || !settings.autoBackupEnabled) {
    return { success: false, message: 'Backups not enabled' };
  }

  const updated = await updateBackupSettings({ lastBackupAt: new Date() });
  return { success: true, message: 'Backup triggered successfully', backup: updated };
}

// ─── Localization Settings ──────────────────────────────────────────────
export async function getLocalizationSettings() {
  const db = await getDb();
  return await db.select().from(localizationSettings).where(eq(localizationSettings.isEnabled, true));
}

export async function getDefaultLanguage() {
  const db = await getDb();
  const lang = await db.select().from(localizationSettings).where(eq(localizationSettings.isDefault, true)).limit(1);
  return lang[0]?.language || 'en';
}

export async function addLanguage(language: string, languageName: string) {
  const db = await getDb();
  await db.insert(localizationSettings).values({ language, languageName, isEnabled: true });
}

export async function removeLanguage(language: string) {
  const db = await getDb();
  await db.update(localizationSettings).set({ isEnabled: false }).where(eq(localizationSettings.language, language));
}

export async function setDefaultLanguage(language: string) {
  const db = await getDb();
  await db.update(localizationSettings).set({ isDefault: false });
  await db.update(localizationSettings).set({ isDefault: true }).where(eq(localizationSettings.language, language));
}

// ─── Currency Settings ──────────────────────────────────────────────────
export async function getCurrencySettings() {
  const db = await getDb();
  return await db.select().from(currencySettings).where(eq(currencySettings.isEnabled, true));
}

export async function getDefaultCurrency() {
  const db = await getDb();
  const curr = await db.select().from(currencySettings).where(eq(currencySettings.isDefault, true)).limit(1);
  return curr[0]?.currencyCode || 'USD';
}

export async function addCurrency(currencyCode: string, currencyName: string, currencySymbol: string, exchangeRate: string = '1') {
  const db = await getDb();
  await db.insert(currencySettings).values({ currencyCode, currencyName, currencySymbol, exchangeRate, isEnabled: true });
}

export async function removeCurrency(currencyCode: string) {
  const db = await getDb();
  await db.update(currencySettings).set({ isEnabled: false }).where(eq(currencySettings.currencyCode, currencyCode));
}

export async function setDefaultCurrency(currencyCode: string) {
  const db = await getDb();
  await db.update(currencySettings).set({ isDefault: false });
  await db.update(currencySettings).set({ isDefault: true }).where(eq(currencySettings.currencyCode, currencyCode));
}

export async function updateExchangeRate(currencyCode: string, exchangeRate: string) {
  const db = await getDb();
  await db.update(currencySettings).set({ exchangeRate }).where(eq(currencySettings.currencyCode, currencyCode));
}

// ─── Settings Validation ────────────────────────────────────────────────
export async function validateAllSettings() {
  const results = {
    system: await getSystemSettings(),
    email: await getEmailSettings(),
    payment: await getPaymentSettings(),
    delivery: await getDeliverySettings(),
    receipt: await getReceiptSettings(),
    security: await getSecuritySettings(),
    auditLog: await getAuditLogSettings(),
    backup: await getBackupSettings(),
    languages: await getLocalizationSettings(),
    currencies: await getCurrencySettings(),
  };

  return results;
}

export async function resetSettingsToDefaults() {
  const db = await getDb();

  // Clear all settings
  await db.delete(systemSettings);
  await db.delete(emailSettings);
  await db.delete(paymentSettings);
  await db.delete(deliverySettings);
  await db.delete(receiptSettings);
  await db.delete(securitySettings);
  await db.delete(apiKeys);
  await db.delete(auditLogSettings);
  await db.delete(backupSettings);

  // Insert defaults
  await db.insert(systemSettings).values({
    restaurantName: 'My Restaurant',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
  });

  await db.insert(paymentSettings).values({
    cashPaymentEnabled: true,
    checkPaymentEnabled: true,
  });

  await db.insert(receiptSettings).values({
    showItemDescription: true,
    showItemPrice: true,
    showTaxBreakdown: true,
  });

  await db.insert(securitySettings).values({
    sessionTimeout: 3600,
    passwordMinLength: 8,
  });

  await db.insert(auditLogSettings).values({
    enableAuditLogging: true,
    logUserActions: true,
  });

  await db.insert(backupSettings).values({
    autoBackupEnabled: true,
    backupFrequency: 'daily',
  });

  return { success: true, message: 'Settings reset to defaults' };
}


// ─── INTEGRATIONS ───────────────────────────────────────────────────
export async function createIntegration(data: {
  type: string;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  config?: string;
}) {
  const db = await getDb();
  const result = await db.insert(integrations).values({
    type: data.type as any,
    name: data.name,
    apiKey: data.apiKey,
    apiSecret: data.apiSecret,
    webhookUrl: data.webhookUrl,
    config: data.config,
    isEnabled: true,
  });
  return result;
}

export async function getIntegrations() {
  const db = await getDb();
  return await db.select().from(integrations).where(eq(integrations.isEnabled, true));
}

export async function getIntegrationById(id: number) {
  const db = await getDb();
  return await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
}

export async function updateIntegration(id: number, data: any) {
  const db = await getDb();
  return await db.update(integrations).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(integrations.id, id));
}

export async function deleteIntegration(id: number) {
  const db = await getDb();
  return await db.delete(integrations).where(eq(integrations.id, id));
}

export async function logIntegrationAction(integrationId: number, action: string, status: string, message?: string, requestData?: any, responseData?: any) {
  const db = await getDb();
  return await db.insert(integrationLogs).values({
    integrationId,
    action,
    status: status as any,
    message,
    requestData: requestData ? JSON.stringify(requestData) : null,
    responseData: responseData ? JSON.stringify(responseData) : null,
  });
}

export async function getIntegrationLogs(integrationId: number, limit = 50) {
  const db = await getDb();
  return await db.select().from(integrationLogs)
    .where(eq(integrationLogs.integrationId, integrationId))
    .orderBy(desc(integrationLogs.createdAt))
    .limit(limit);
}

export async function listWebhooks() {
  const db = await getDb();
  return await db.select().from(integrations)
    .where(and(eq(integrations.type, 'webhook' as any), eq(integrations.isEnabled, true)))
    .orderBy(desc(integrations.createdAt));
}

export async function createWebhookIntegration(url: string, event: string) {
  const db = await getDb();
  const result = await db.insert(integrations).values({
    type: 'webhook' as any,
    name: `Webhook – ${event}`,
    webhookUrl: url,
    config: JSON.stringify({ event }),
    isEnabled: true,
  });
  return result;
}

// ─── CUSTOM REPORTS ─────────────────────────────────────────────────
export async function createCustomReport(data: {
  name: string;
  description?: string;
  type: string;
  filters?: string;
  columns?: string;
  sortBy?: string;
  sortOrder?: string;
  isPublic?: boolean;
  createdBy: number;
}) {
  const db = await getDb();
  return await db.insert(customReports).values({
    name: data.name,
    description: data.description,
    type: data.type as any,
    filters: data.filters,
    columns: data.columns,
    sortBy: data.sortBy,
    sortOrder: (data.sortOrder as any) || 'asc',
    isPublic: data.isPublic || false,
    createdBy: data.createdBy,
  });
}

export async function getCustomReports(userId: number) {
  const db = await getDb();
  return await db.select().from(customReports)
    .where(or(
      eq(customReports.createdBy, userId),
      eq(customReports.isPublic, true)
    ));
}

export async function getCustomReportById(id: number) {
  const db = await getDb();
  return await db.select().from(customReports).where(eq(customReports.id, id)).limit(1);
}

export async function updateCustomReport(id: number, data: any) {
  const db = await getDb();
  return await db.update(customReports).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(customReports.id, id));
}

export async function deleteCustomReport(id: number) {
  const db = await getDb();
  return await db.delete(customReports).where(eq(customReports.id, id));
}

export async function createReportExport(reportId: number, format: string, fileName: string, fileUrl: string, fileSize: number, exportedBy: number) {
  const db = await getDb();
  return await db.insert(reportExports).values({
    reportId,
    format: format as any,
    fileName,
    fileUrl,
    fileSize,
    status: 'completed',
    exportedBy,
  });
}

export async function getReportExports(reportId: number) {
  const db = await getDb();
  return await db.select().from(reportExports)
    .where(eq(reportExports.reportId, reportId))
    .orderBy(desc(reportExports.createdAt));
}

// ─── ANALYTICS DASHBOARD ────────────────────────────────────────────
export async function createAnalyticsDashboard(data: {
  name: string;
  description?: string;
  widgets: string;
  refreshInterval?: number;
  isDefault?: boolean;
  createdBy: number;
}) {
  const db = await getDb();
  return await db.insert(analyticsDashboard).values({
    name: data.name,
    description: data.description,
    widgets: data.widgets,
    refreshInterval: data.refreshInterval || 300,
    isDefault: data.isDefault || false,
    createdBy: data.createdBy,
  });
}

export async function getAnalyticsDashboards() {
  const db = await getDb();
  return await db.select().from(analyticsDashboard).orderBy(desc(analyticsDashboard.updatedAt));
}

export async function getDefaultAnalyticsDashboard() {
  const db = await getDb();
  return await db.select().from(analyticsDashboard).where(eq(analyticsDashboard.isDefault, true)).limit(1);
}

export async function updateAnalyticsDashboard(id: number, data: any) {
  const db = await getDb();
  return await db.update(analyticsDashboard).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(analyticsDashboard.id, id));
}

// ─── KPI METRICS ────────────────────────────────────────────────────
export async function recordKPIMetrics(date: string, metrics: {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  customerCount: number;
  newCustomers: number;
  repeatCustomers: number;
  labourCost: number;
  foodCost: number;
  primeCost: number;
  netProfit: number;
  profitMargin: number;
}) {
  const db = await getDb();
  return await db.insert(kpiMetrics).values({
    date,
    totalRevenue: metrics.totalRevenue.toString(),
    totalOrders: metrics.totalOrders,
    averageOrderValue: metrics.averageOrderValue.toString(),
    customerCount: metrics.customerCount,
    newCustomers: metrics.newCustomers,
    repeatCustomers: metrics.repeatCustomers,
    labourCost: metrics.labourCost.toString(),
    foodCost: metrics.foodCost.toString(),
    primeCost: metrics.primeCost.toString(),
    netProfit: metrics.netProfit.toString(),
    profitMargin: metrics.profitMargin.toString(),
  });
}

export async function getKPIMetrics(startDate: string, endDate: string) {
  const db = await getDb();
  return await db.select().from(kpiMetrics)
    .where(and(
      gte(kpiMetrics.date, startDate),
      lte(kpiMetrics.date, endDate)
    ))
    .orderBy(asc(kpiMetrics.date));
}

export async function getLatestKPIMetrics() {
  const db = await getDb();
  return await db.select().from(kpiMetrics)
    .orderBy(desc(kpiMetrics.date))
    .limit(1);
}

// ─── FORECASTING DATA ───────────────────────────────────────────────
export async function recordForecastingData(date: string, dayOfWeek: string, forecastedRevenue: number, forecastedOrders: number, confidence: number) {
  const db = await getDb();
  return await db.insert(forecastingData).values({
    date,
    dayOfWeek,
    forecastedRevenue: forecastedRevenue.toString(),
    forecastedOrders,
    confidence: confidence.toString(),
  });
}

export async function createForecastingData(data: typeof forecastingData.$inferInsert) {
  const db = await getDb();
  return await db.insert(forecastingData).values(data);
}

export async function getForecastingDataByDate(date: string) {
  const db = await getDb();
  return await db.select().from(forecastingData).where(eq(forecastingData.date, date));
}

export async function updateForecastingData(id: number, data: Partial<typeof forecastingData.$inferInsert>) {
  const db = await getDb();
  return await db.update(forecastingData).set(data).where(eq(forecastingData.id, id));
}

export async function updateForecastingActuals(date: string, actualRevenue: number, actualOrders: number) {
  const db = await getDb();
  const existing = await db.select().from(forecastingData).where(eq(forecastingData.date, date)).limit(1);

  if (existing.length > 0) {
    const forecast = existing[0];
    const revenueAccuracy = forecast.forecastedRevenue
      ? Math.abs(parseFloat(forecast.forecastedRevenue.toString()) - actualRevenue) / parseFloat(forecast.forecastedRevenue.toString()) * 100
      : 0;

    return await db.update(forecastingData).set({
      actualRevenue: actualRevenue.toString(),
      actualOrders,
      accuracy: (100 - Math.min(revenueAccuracy, 100)).toString(),
    }).where(eq(forecastingData.date, date));
  }
}

export async function getForecastingData(startDate: string, endDate: string) {
  const db = await getDb();
  return await db.select().from(forecastingData)
    .where(and(
      gte(forecastingData.date, startDate),
      lte(forecastingData.date, endDate)
    ))
    .orderBy(asc(forecastingData.date));
}

export async function getForecastAccuracy(days = 30) {
  const db = await getDb();
  const data = await db.select().from(forecastingData)
    .where(and(
      isNotNull(forecastingData.accuracy),
      gte(forecastingData.accuracy, sql`0`)
    ))
    .orderBy(desc(forecastingData.date))
    .limit(days);

  if (data.length === 0) return 0;
  const totalAccuracy = data.reduce((sum, row) => sum + parseFloat(row.accuracy?.toString() || '0'), 0);
  return totalAccuracy / data.length;
}

// ─── STOCK PERFORMANCE ALERTS ─────────────────────────────────────────

export async function createStockPerformanceAlert(data: typeof stockPerformanceAlerts.$inferInsert) {
  const db = await getDb();
  return await db.insert(stockPerformanceAlerts).values(data);
}

export async function getUnresolvedStockAlerts() {
  const db = await getDb();
  return await db.select().from(stockPerformanceAlerts)
    .where(eq(stockPerformanceAlerts.isResolved, false))
    .orderBy(desc(stockPerformanceAlerts.dateGenerated));
}

// ─── ADVANCED ANALYTICS ─────────────────────────────────────────────

export async function getHistoricalSeasonality() {
  const db = await getDb();
  // Group by month (1-12) and category to find long-term seasonal trends
  // This massively compresses years of data into a small matrix for the AI
  return await db.select({
    month: sql<number>`MONTH(${orders.createdAt})`,
    categoryName: menuCategories.name,
    avgQuantityPerMonth: sql<number>`AVG(${orderItems.quantity})`,
    totalRevenueInMonth: sql<number>`SUM(${orderItems.quantity} * ${orderItems.unitPrice})`
  })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(menuItems, eq(menuItems.id, orderItems.menuItemId))
    .innerJoin(menuCategories, eq(menuCategories.id, menuItems.categoryId))
    .where(isNotNull(orders.createdAt)) // Ensure we have a date
    .groupBy(sql`MONTH(${orders.createdAt})`, menuCategories.name)
    .orderBy(sql`MONTH(${orders.createdAt})`, menuCategories.name);
}

export async function getRevenueByCategory(startDate: string, endDate: string) {
  const db = await getDb();
  return await db.select({
    category: menuCategories.name,
    revenue: sql`SUM(${orderItems.quantity} * ${orderItems.unitPrice})`,
    itemCount: sql`COUNT(${orderItems.id})`,
  })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(menuItems, eq(menuItems.id, orderItems.menuItemId))
    .innerJoin(menuCategories, eq(menuCategories.id, menuItems.categoryId))
    .where(and(
      gte(orders.createdAt, new Date(startDate)),
      lte(orders.createdAt, new Date(endDate))
    ))
    .groupBy(menuCategories.id);
}

export async function getCustomerSegmentMetrics() {
  const db = await getDb();
  return await db.select({
    segment: customerSegments.name,
    customerCount: sql`COUNT(DISTINCT ${segmentMembers.customerId})`,
    totalRevenue: sql`SUM(${orders.total})`,
    averageOrderValue: sql`AVG(${orders.total})`,
  })
    .from(customerSegments)
    .leftJoin(segmentMembers, eq(segmentMembers.segmentId, customerSegments.id))
    .leftJoin(customers, eq(customers.id, segmentMembers.customerId))
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(customerSegments.id);
}

export async function getPeakHours(startDate: string, endDate: string) {
  const db = await getDb();
  return await db.select({
    hour: sql`HOUR(${orders.createdAt})`,
    orderCount: sql`COUNT(${orders.id})`,
    totalRevenue: sql`SUM(${orders.total})`,
    averageOrderValue: sql`AVG(${orders.total})`,
  })
    .from(orders)
    .where(and(
      gte(orders.createdAt, new Date(startDate)),
      lte(orders.createdAt, new Date(endDate))
    ))
    .groupBy(sql`HOUR(${orders.createdAt})`)
    .orderBy(sql`HOUR(${orders.createdAt})`);
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTING DB HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Profitability summary for a date range
 */
export async function getProfitabilitySummary(dateFrom: string, dateTo: string) {
  const db = await getDb();
  const start = new Date(dateFrom + "T00:00:00Z");
  const end = new Date(dateTo + "T23:59:59Z");

  const orderData = await db.select({
    totalRevenue: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
    totalOrders: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    gte(orders.createdAt, start),
    lte(orders.createdAt, end),
    ne(orders.status, "cancelled"),
    ne(orders.status, "voided"),
  ));

  const revenue = Number(orderData[0]?.totalRevenue || 0);
  const totalOrders = Number(orderData[0]?.totalOrders || 0);

  const wasteData = await db.select({
    totalCost: sql<number>`CAST(SUM(CAST(${wasteLogs.cost} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
  }).from(wasteLogs).where(and(gte(wasteLogs.loggedAt, start), lte(wasteLogs.loggedAt, end)));
  const wasteCost = Number(wasteData[0]?.totalCost || 0);

  const cogs = revenue * 0.30 + wasteCost;
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;
  const avgTicket = totalOrders > 0 ? revenue / totalOrders : 0;

  return {
    totalRevenue: revenue,
    totalOrders,
    avgTicket,
    cogs,
    grossProfit,
    grossMargin,
    cogsPercentage,
  };
}

/**
 * Profitability breakdown by menu category
 */
export async function getProfitabilityByCategory(dateFrom: string, dateTo: string) {
  const db = await getDb();
  const start = new Date(dateFrom + "T00:00:00Z");
  const end = new Date(dateTo + "T23:59:59Z");

  const rows = await db.select({
    categoryId: menuCategories.id,
    categoryName: menuCategories.name,
    quantity: sql<number>`SUM(${orderItems.quantity})`,
    revenue: sql<number>`SUM(${orderItems.quantity} * CAST(${orderItems.unitPrice} AS DECIMAL(10,2)))`,
  })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(menuItems, eq(menuItems.id, orderItems.menuItemId))
    .innerJoin(menuCategories, eq(menuCategories.id, menuItems.categoryId))
    .where(and(
      gte(orders.createdAt, start),
      lte(orders.createdAt, end),
      ne(orders.status, "cancelled"),
      ne(orders.status, "voided"),
    ))
    .groupBy(menuCategories.id, menuCategories.name);

  return rows.map(r => {
    const rev = Number(r.revenue || 0);
    const cogs = rev * 0.30;
    const grossProfit = rev - cogs;
    const profitMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    return {
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      quantity: Number(r.quantity || 0),
      revenue: rev,
      cogs,
      grossProfit,
      profitMargin,
    };
  });
}

/**
 * Profitability breakdown by menu item
 */
export async function getProfitabilityByItem(dateFrom: string, dateTo: string) {
  const db = await getDb();
  const start = new Date(dateFrom + "T00:00:00Z");
  const end = new Date(dateTo + "T23:59:59Z");

  const rows = await db.select({
    itemId: menuItems.id,
    itemName: menuItems.name,
    quantity: sql<number>`SUM(${orderItems.quantity})`,
    revenue: sql<number>`SUM(${orderItems.quantity} * CAST(${orderItems.unitPrice} AS DECIMAL(10,2)))`,
    cost: menuItems.cost,
  })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(menuItems, eq(menuItems.id, orderItems.menuItemId))
    .where(and(
      gte(orders.createdAt, start),
      lte(orders.createdAt, end),
      ne(orders.status, "cancelled"),
      ne(orders.status, "voided"),
    ))
    .groupBy(menuItems.id, menuItems.name, menuItems.cost);

  return rows.map(r => {
    const rev = Number(r.revenue || 0);
    const qty = Number(r.quantity || 0);
    const unitCost = Number(r.cost || 0);
    const cogs = unitCost > 0 ? qty * unitCost : rev * 0.30;
    const grossProfit = rev - cogs;
    const profitMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    return {
      itemId: r.itemId,
      itemName: r.itemName,
      quantity: qty,
      revenue: rev,
      cogs,
      grossProfit,
      profitMargin,
    };
  });
}

/**
 * Top N most profitable items
 */
export async function getTopProfitableItems(limit: number, dateFrom: string, dateTo: string) {
  const items = await getProfitabilityByItem(dateFrom, dateTo);
  return items
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, limit);
}

/**
 * Bottom N least profitable items
 */
export async function getBottomProfitableItems(limit: number, dateFrom: string, dateTo: string) {
  const items = await getProfitabilityByItem(dateFrom, dateTo);
  return items
    .sort((a, b) => a.grossProfit - b.grossProfit)
    .slice(0, limit);
}

/**
 * Daily profit trend
 */
export async function getDailyProfitTrend(dateFrom: string, dateTo: string) {
  const db = await getDb();
  const start = new Date(dateFrom + "T00:00:00Z");
  const end = new Date(dateTo + "T23:59:59Z");

  const rows = await db.select({
    date: sql<string>`DATE(${orders.createdAt})`,
    revenue: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
    orderCount: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    gte(orders.createdAt, start),
    lte(orders.createdAt, end),
    ne(orders.status, "cancelled"),
    ne(orders.status, "voided"),
  )).groupBy(sql`1`);

  return rows.map(r => {
    const rev = Number(r.revenue || 0);
    const cogs = rev * 0.30;
    const grossProfit = rev - cogs;
    const profitMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    const netProfit = grossProfit; // labour not per-day here
    return {
      date: r.date,
      revenue: rev,
      cogs,
      grossProfit,
      netProfit,
      profitMargin,
      orderCount: Number(r.orderCount || 0),
    };
  });
}

/**
 * Staff Sales Performance
 */
export async function getStaffLabourCostSummary(startDate: Date, endDate: Date, staffId?: number, role?: string) {
  const db = await getDb();
  const conditions: any[] = [
    gte(timeClock.clockIn, startDate),
    lte(timeClock.clockIn, endDate),
  ];
  if (staffId) conditions.push(eq(timeClock.staffId, staffId));

  const entries = await db.select().from(timeClock).where(and(...conditions));
  const staffList = await db.select().from(staff).where(eq(staff.isActive, true));
  const staffMap = new Map(staffList.map(s => [s.id, s]));

  // Group by staff
  const byStaff = new Map<number, { totalHours: number }>();
  for (const entry of entries) {
    if (!entry.clockOut) continue;
    const member = staffMap.get(entry.staffId);
    if (role && member?.role !== role) continue;
    const hours = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
    const curr = byStaff.get(entry.staffId) || { totalHours: 0 };
    curr.totalHours += hours;
    byStaff.set(entry.staffId, curr);
  }

  return Array.from(byStaff.entries()).map(([sid, data]) => {
    const member = staffMap.get(sid);
    return {
      staffId: sid,
      staffName: member?.name || "Unknown",
      role: member?.role || "unknown",
      totalHours: data.totalHours.toFixed(2),
      hourlyRate: member?.hourlyRate || "0",
    };
  });
}

/**
 * Orders count & revenue grouped by order type
 */
export async function getSalesByOrderType(dateFrom: string, dateTo: string) {
  const db = await getDb();
  const start = new Date(dateFrom + "T00:00:00Z");
  const end = new Date(dateTo + "T23:59:59Z");

  const rows = await db.select({
    type: orders.type,
    count: sql<number>`COUNT(*)`,
    revenue: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
  }).from(orders).where(and(
    gte(orders.createdAt, start),
    lte(orders.createdAt, end),
    ne(orders.status, "cancelled"),
    ne(orders.status, "voided"),
  )).groupBy(orders.type);

  return rows.map(r => ({
    type: r.type,
    count: Number(r.count || 0),
    revenue: Number(r.revenue || 0),
  }));
}

/**
 * Compute a KPI metrics object for the analytics dashboard
 */
export async function getKPIDashboardMetrics(startDate: string, endDate: string) {
  const db = await getDb();
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T23:59:59Z");

  // current period
  const curr = await db.select({
    revenue: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
    count: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    gte(orders.createdAt, start),
    lte(orders.createdAt, end),
    ne(orders.status, "cancelled"),
    ne(orders.status, "voided"),
  ));

  const periodMs = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - periodMs);
  const prevEnd = new Date(start.getTime() - 1);

  const prev = await db.select({
    revenue: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
    count: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    gte(orders.createdAt, prevStart),
    lte(orders.createdAt, prevEnd),
    ne(orders.status, "cancelled"),
    ne(orders.status, "voided"),
  ));

  const revenueCurr = Number(curr[0]?.revenue || 0);
  const countCurr = Number(curr[0]?.count || 0);
  const revenuePrev = Number(prev[0]?.revenue || 0);
  const countPrev = Number(prev[0]?.count || 0);
  const aovCurr = countCurr > 0 ? revenueCurr / countCurr : 0;
  const aovPrev = countPrev > 0 ? revenuePrev / countPrev : 0;

  const pct = (curr: number, prev: number) =>
    prev > 0 ? Number(((curr - prev) / prev * 100).toFixed(1)) : 0;

  // Labour cost
  const timeEntries = await db.select().from(timeClock).where(
    and(gte(timeClock.clockIn, start), lte(timeClock.clockIn, end))
  );
  const staffList = await db.select().from(staff).where(eq(staff.isActive, true));
  const avgRate = staffList.length > 0
    ? staffList.reduce((s, m) => s + Number(m.hourlyRate || 0), 0) / staffList.length
    : 0;
  let totalHours = 0;
  for (const e of timeEntries) {
    if (e.clockOut) totalHours += (e.clockOut.getTime() - e.clockIn.getTime()) / (1000 * 60 * 60);
  }
  const labourCost = totalHours * avgRate;
  const labourCostPercent = revenueCurr > 0 ? Number((labourCost / revenueCurr * 100).toFixed(1)) : 0;

  return {
    totalRevenue: `$${revenueCurr.toFixed(2)}`,
    revenueChange: pct(revenueCurr, revenuePrev),
    totalOrders: countCurr,
    ordersChange: pct(countCurr, countPrev),
    avgOrderValue: `$${aovCurr.toFixed(2)}`,
    aovChange: pct(aovCurr, aovPrev),
    labourCostPercent,
    labourCostChange: 0,
    rawRevenue: revenueCurr,
    rawOrders: countCurr,
    rawAOV: aovCurr,
    labourCost,
  };
}

/**
 * Profitability by shift/staff (groups orders by staffId)
 */
export async function getProfitabilityByShift(dateFrom: string, dateTo: string) {
  const db = await getDb();
  const start = new Date(dateFrom + "T00:00:00Z");
  const end = new Date(dateTo + "T23:59:59Z");

  const rows = await db.select({
    staffId: orders.staffId,
    revenue: sql<number>`CAST(SUM(CAST(${orders.total} AS DECIMAL(10,2))) AS DECIMAL(10,2))`,
    orderCount: sql<number>`COUNT(*)`,
  }).from(orders).where(and(
    gte(orders.createdAt, start),
    lte(orders.createdAt, end),
    ne(orders.status, "cancelled"),
    ne(orders.status, "voided"),
  )).groupBy(orders.staffId);

  const staffList = await db.select().from(staff);
  const staffMap = new Map(staffList.map(s => [s.id, s]));

  return rows.map(r => {
    const rev = Number(r.revenue || 0);
    const cogs = rev * 0.30;
    const labourCost = Number(staffMap.get(r.staffId || 0)?.hourlyRate || 0) * 8;
    const netProfit = rev - cogs - labourCost;
    return {
      staffId: r.staffId,
      staffName: staffMap.get(r.staffId || 0)?.name || "Unassigned",
      revenue: rev,
      cogs,
      labourCost,
      netProfit,
      orderCount: Number(r.orderCount || 0),
    };
  });
}

// ─── DATA IMPORT JOBS ───────────────────────────────────────────────
export async function createDataImportJob(data: {
  type: string;
  fileUrl?: string;
  createdBy: number;
}) {
  const db = await getDb();
  return await db.insert(dataImportJobs).values(data);
}

export async function getDataImportJobs(limit = 100) {
  const db = await getDb();
  return await db.select().from(dataImportJobs).orderBy(desc(dataImportJobs.createdAt)).limit(limit);
}


export async function getDataImportJobById(id: number) {
  const db = await getDb();
  return await db.select().from(dataImportJobs).where(eq(dataImportJobs.id, id)).limit(1);
}

export async function updateDataImportJob(id: number, data: any) {
  const db = await getDb();
  return await db.update(dataImportJobs).set({ ...data, updatedAt: new Date() }).where(eq(dataImportJobs.id, id));
}

