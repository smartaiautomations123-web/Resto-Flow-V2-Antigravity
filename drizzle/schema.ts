import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Staff ───────────────────────────────────────────────────────────
export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  pin: varchar("pin", { length: 10 }),
  role: mysqlEnum("role", ["owner", "manager", "server", "bartender", "kitchen"]).default("server").notNull(),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Time Clock ──────────────────────────────────────────────────────
export const timeClock = mysqlTable("time_clock", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  clockIn: timestamp("clockIn").notNull(),
  clockOut: timestamp("clockOut"),
  breakMinutes: int("breakMinutes").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Shifts / Schedules ─────────────────────────────────────────────
export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 5 }).notNull(),
  role: varchar("role", { length: 32 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Menu Categories ─────────────────────────────────────────────────
export const menuCategories = mysqlTable("menu_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Menu Items ──────────────────────────────────────────────────────
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0"),
  imageUrl: text("imageUrl"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  isPopular: boolean("isPopular").default(false).notNull(),
  prepTime: int("prepTime").default(10), // minutes
  station: mysqlEnum("station", ["grill", "fryer", "salad", "dessert", "bar", "general"]).default("general"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Menu Modifiers ──────────────────────────────────────────────────
export const menuModifiers = mysqlTable("menu_modifiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  groupName: varchar("groupName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Item-Modifier link ──────────────────────────────────────────────
export const itemModifiers = mysqlTable("item_modifiers", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  modifierId: int("modifierId").notNull(),
});

// ─── Floor Plan Sections ─────────────────────────────────────────────
export const sections = mysqlTable("sections", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Section = typeof sections.$inferSelect;
export type InsertSection = typeof sections.$inferInsert;

// ─── Tables / Floor Plan ─────────────────────────────────────────────
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  seats: int("seats").default(4),
  status: mysqlEnum("status", ["free", "occupied", "reserved", "cleaning"]).default("free").notNull(),
  positionX: int("positionX").default(0),
  positionY: int("positionY").default(0),
  section: varchar("section", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Orders ──────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 32 }).notNull(),
  type: mysqlEnum("type", ["dine_in", "takeaway", "delivery", "collection", "online"]).default("dine_in").notNull(),
  status: mysqlEnum("status", ["pending", "preparing", "ready", "served", "completed", "cancelled", "voided"]).default("pending").notNull(),
  tableId: int("tableId"),
  staffId: int("staffId"),
  customerId: int("customerId"),
  customerName: varchar("customerName", { length: 255 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0"),
  serviceCharge: decimal("serviceCharge", { precision: 10, scale: 2 }).default("0"),
  tipAmount: decimal("tipAmount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "cash", "split", "online", "unpaid"]).default("unpaid"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded", "partial"]).default("unpaid"),
  voidReason: mysqlEnum("voidReason", ["customer_request", "mistake", "damage", "comp", "other"]),
  refundMethod: mysqlEnum("refundMethod", ["original_payment", "store_credit", "cash"]),
  voidRequestedBy: int("voidRequestedBy"),
  voidRequestedAt: timestamp("voidRequestedAt"),
  voidApprovedBy: int("voidApprovedBy"),
  voidApprovedAt: timestamp("voidApprovedAt"),
  voidNotes: text("voidNotes"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

// ─── Void Audit Log ──────────────────────────────────────────────────
export const voidAuditLog = mysqlTable("void_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  action: mysqlEnum("action", ["void_requested", "void_approved", "void_rejected", "refund_processed"]).notNull(),
  reason: varchar("reason", { length: 255 }),
  refundMethod: mysqlEnum("refundMethod", ["original_payment", "store_credit", "cash"]),
  performedBy: int("performedBy").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VoidAuditLog = typeof voidAuditLog.$inferSelect;
export type InsertVoidAuditLog = typeof voidAuditLog.$inferInsert;

// ─── Order Items ─────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  menuItemId: int("menuItemId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  modifiers: json("modifiers"), // [{name, price}]
  status: mysqlEnum("status", ["pending", "preparing", "ready", "served", "voided"]).default("pending").notNull(),
  station: varchar("station", { length: 32 }),
  notes: text("notes"),
  sentToKitchenAt: timestamp("sentToKitchenAt"),
  readyAt: timestamp("readyAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Ingredients ─────────────────────────────────────────────────────
export const ingredients = mysqlTable("ingredients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull(), // kg, L, pcs, etc.
  currentStock: decimal("currentStock", { precision: 10, scale: 3 }).default("0"),
  minStock: decimal("minStock", { precision: 10, scale: 3 }).default("0"),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 4 }).default("0"),
  supplierId: int("supplierId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Recipes (menu item → ingredient link) ──────────────────────────
export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
});

// ─── Suppliers ───────────────────────────────────────────────────────
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Purchase Orders ─────────────────────────────────────────────────
export const purchaseOrders = mysqlTable("purchase_orders", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "received", "cancelled"]).default("draft").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  orderedAt: timestamp("orderedAt"),
  receivedAt: timestamp("receivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Purchase Order Items ────────────────────────────────────────────
export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: int("id").autoincrement().primaryKey(),
  purchaseOrderId: int("purchaseOrderId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 4 }).notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
});

// ─── Customers ───────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  loyaltyPoints: int("loyaltyPoints").default(0),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0"),
  visitCount: int("visitCount").default(0),
  notes: text("notes"),
  birthday: varchar("birthday", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Customer Segments ───────────────────────────────────────────────
export const customerSegments = mysqlTable("customer_segments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const segmentMembers = mysqlTable("segment_members", {
  id: int("id").autoincrement().primaryKey(),
  segmentId: int("segmentId").notNull(),
  customerId: int("customerId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

// ─── Campaigns ───────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["email", "sms", "push"]).default("email").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  segmentId: int("segmentId"),
  status: mysqlEnum("status", ["draft", "scheduled", "sent", "cancelled"]).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  totalRecipients: int("totalRecipients").default(0),
  sentCount: int("sentCount").default(0),
  openCount: int("openCount").default(0),
  clickCount: int("clickCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const campaignRecipients = mysqlTable("campaign_recipients", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  customerId: int("customerId").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "opened", "clicked"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Reservations ────────────────────────────────────────────────────
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId"),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  guestPhone: varchar("guestPhone", { length: 32 }),
  guestEmail: varchar("guestEmail", { length: 320 }),
  tableId: int("tableId"),
  partySize: int("partySize").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  time: varchar("time", { length: 5 }).notNull(),
  status: mysqlEnum("status", ["confirmed", "seated", "completed", "cancelled", "no_show"]).default("confirmed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Waitlist ────────────────────────────────────────────────────────
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId"),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  guestPhone: varchar("guestPhone", { length: 32 }),
  guestEmail: varchar("guestEmail", { length: 320 }),
  partySize: int("partySize").notNull(),
  estimatedWaitTime: int("estimatedWaitTime").default(0), // in minutes
  status: mysqlEnum("status", ["waiting", "called", "seated", "cancelled"]).default("waiting").notNull(),
  notes: text("notes"),
  position: int("position").notNull(), // position in queue
  smsNotificationSent: boolean("smsNotificationSent").default(false),
  smsNotificationSentAt: timestamp("smsNotificationSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Vendor Products (per-vendor product catalog) ───────────────────
export const vendorProducts = mysqlTable("vendor_products", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  vendorCode: varchar("vendorCode", { length: 32 }).notNull(),
  description: text("description").notNull(),
  packSize: varchar("packSize", { length: 128 }), // e.g. "4/5# 4/5lb", "12/1pint"
  packUnit: varchar("packUnit", { length: 32 }), // normalized unit: lb, oz, each, case, etc.
  packQty: decimal("packQty", { precision: 10, scale: 4 }), // total qty in smallest unit per pack
  unitPricePer: varchar("unitPricePer", { length: 32 }), // "lb", "each", "oz", etc.
  currentCasePrice: decimal("currentCasePrice", { precision: 10, scale: 2 }).default("0"),
  currentUnitPrice: decimal("currentUnitPrice", { precision: 10, scale: 4 }).default("0"), // # price or calculated
  lastUpdated: timestamp("lastUpdated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Vendor Product Mappings (vendor code → internal ingredient) ────
export const vendorProductMappings = mysqlTable("vendor_product_mappings", {
  id: int("id").autoincrement().primaryKey(),
  vendorProductId: int("vendorProductId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Price Uploads (upload history) ─────────────────────────────────
export const priceUploads = mysqlTable("price_uploads", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileUrl: text("fileUrl"),
  dateRangeStart: varchar("dateRangeStart", { length: 10 }), // from PDF header
  dateRangeEnd: varchar("dateRangeEnd", { length: 10 }),
  status: mysqlEnum("status", ["processing", "review", "applied", "failed"]).default("processing").notNull(),
  totalItems: int("totalItems").default(0),
  newItems: int("newItems").default(0),
  priceChanges: int("priceChanges").default(0),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Price Upload Items (extracted line items from each upload) ─────
export const priceUploadItems = mysqlTable("price_upload_items", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  vendorCode: varchar("vendorCode", { length: 32 }).notNull(),
  description: text("description").notNull(),
  casePrice: decimal("casePrice", { precision: 10, scale: 2 }),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 4 }), // # price from PDF
  packSize: varchar("packSize", { length: 128 }),
  calculatedUnitPrice: decimal("calculatedUnitPrice", { precision: 10, scale: 4 }),
  previousCasePrice: decimal("previousCasePrice", { precision: 10, scale: 2 }),
  priceChange: decimal("priceChange", { precision: 10, scale: 2 }), // difference
  isNew: boolean("isNew").default(false).notNull(),
  vendorProductId: int("vendorProductId"), // link to existing vendor_product if matched
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Price History (historical price records for trends) ────────────
export const priceHistory = mysqlTable("price_history", {
  id: int("id").autoincrement().primaryKey(),
  vendorProductId: int("vendorProductId").notNull(),
  uploadId: int("uploadId"),
  casePrice: decimal("casePrice", { precision: 10, scale: 2 }),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 4 }),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

// ─── Z-Reports (End-of-Day summaries) ───────────────────────────────
export const zReports = mysqlTable("z_reports", {
  id: int("id").autoincrement().primaryKey(),
  reportDate: varchar("reportDate", { length: 10 }).notNull(), // YYYY-MM-DD
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0").notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  totalDiscounts: decimal("totalDiscounts", { precision: 12, scale: 2 }).default("0").notNull(),
  totalVoids: decimal("totalVoids", { precision: 12, scale: 2 }).default("0").notNull(),
  totalTips: decimal("totalTips", { precision: 12, scale: 2 }).default("0").notNull(),
  cashTotal: decimal("cashTotal", { precision: 12, scale: 2 }).default("0").notNull(),
  cardTotal: decimal("cardTotal", { precision: 12, scale: 2 }).default("0").notNull(),
  splitTotal: decimal("splitTotal", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  generatedBy: int("generatedBy").notNull(), // staff id
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Z-Report Items (breakdown by category/payment method) ──────────
export const zReportItems = mysqlTable("z_report_items", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  categoryId: int("categoryId"),
  categoryName: varchar("categoryName", { length: 255 }),
  itemCount: int("itemCount").default(0).notNull(),
  itemRevenue: decimal("itemRevenue", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Z-Report Shifts (breakdown by shift) ────────────────────────────
export const zReportShifts = mysqlTable("z_report_shifts", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  shiftNumber: int("shiftNumber").notNull(), // 1, 2, 3, etc.
  staffId: int("staffId"),
  shiftRevenue: decimal("shiftRevenue", { precision: 12, scale: 2 }).default("0").notNull(),
  shiftOrders: int("shiftOrders").default(0).notNull(),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Type exports ────────────────────────────────────────────────────
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;
export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type MenuModifier = typeof menuModifiers.$inferSelect;
// ─── QR Codes ───────────────────────────────────────────────────────────
export const qrCodes = mysqlTable("qr_codes", {
  id: int("id").autoincrement().primaryKey(),
  tableId: int("tableId").notNull().unique(),
  qrUrl: text("qrUrl").notNull(),
  qrSize: int("qrSize").default(200).notNull(),
  format: varchar("format", { length: 20 }).default("png").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QRCode = typeof qrCodes.$inferSelect;
export type InsertQRCode = typeof qrCodes.$inferInsert;

export type Table = typeof tables.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type VendorProduct = typeof vendorProducts.$inferSelect;
export type VendorProductMapping = typeof vendorProductMappings.$inferSelect;
export type PriceUpload = typeof priceUploads.$inferSelect;
export type PriceUploadItem = typeof priceUploadItems.$inferSelect;
export type PriceHistoryRecord = typeof priceHistory.$inferSelect;
export type ZReport = typeof zReports.$inferSelect;
export type InsertZReport = typeof zReports.$inferInsert;
export type ZReportItem = typeof zReportItems.$inferSelect;
export type ZReportShift = typeof zReportShifts.$inferSelect;

// ─── Dayparts & Dynamic Pricing ───────────────────────────────────────────
export const dayparts = mysqlTable("dayparts", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const menuItemDayparts = mysqlTable("menu_item_dayparts", {
  id: int("id").primaryKey().autoincrement(),
  menuItemId: int("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  daypartId: int("daypart_id")
    .notNull()
    .references(() => dayparts.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Void/Refund Reason Tracking ───────────────────────────────────────────
export const voidReasons = mysqlEnum("void_reason", [
  "customer_request",
  "mistake",
  "damage",
  "comp",
  "other",
]);

export const orderVoidReasons = mysqlTable("order_void_reasons", {
  id: int("id").primaryKey().autoincrement(),
  orderId: int("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  reason: voidReasons.notNull(),
  notes: text("notes"),
  voidedBy: int("voided_by")
    .notNull()
    .references(() => staff.id),
  voidedAt: timestamp("voided_at").defaultNow(),
});

export const orderItemVoidReasons = mysqlTable("order_item_void_reasons", {
  id: int("id").primaryKey().autoincrement(),
  orderItemId: int("order_item_id")
    .notNull()
    .references(() => orderItems.id, { onDelete: "cascade" }),
  reason: voidReasons.notNull(),
  notes: text("notes"),
  voidedBy: int("voided_by")
    .notNull()
    .references(() => staff.id),
  voidedAt: timestamp("voided_at").defaultNow(),
});

// ─── SMS Notifications ───────────────────────────────────────────────────────
export const smsSettings = mysqlTable("sms_settings", {
  id: int("id").primaryKey().autoincrement(),
  restaurantId: int("restaurant_id").notNull(),
  twilioAccountSid: varchar("twilio_account_sid", { length: 255 }),
  twilioAuthToken: varchar("twilio_auth_token", { length: 255 }),
  twilioPhoneNumber: varchar("twilio_phone_number", { length: 20 }),
  isEnabled: boolean("is_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const smsMessages = mysqlTable("sms_messages", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // reservation_confirmation, waitlist_ready, order_ready
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, failed, delivered
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerSmsPreferences = mysqlTable("customer_sms_preferences", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  optInReservations: boolean("opt_in_reservations").default(true),
  optInWaitlist: boolean("opt_in_waitlist").default(true),
  optInOrderUpdates: boolean("opt_in_order_updates").default(true),
  optInPromotions: boolean("opt_in_promotions").default(false),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

// ─── Email Campaigns ───────────────────────────────────────────────────────
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  htmlContent: text("html_content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const emailCampaigns = mysqlTable("email_campaigns", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  templateId: int("template_id")
    .notNull()
    .references(() => emailTemplates.id),
  segmentId: int("segment_id").references(() => customerSegments.id),
  status: varchar("status", { length: 20 }).default("draft"), // draft, scheduled, sent, paused
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: int("recipient_count").default(0),
  openCount: int("open_count").default(0),
  clickCount: int("click_count").default(0),
  conversionCount: int("conversion_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const emailCampaignRecipients = mysqlTable("email_campaign_recipients", {
  id: int("id").primaryKey().autoincrement(),
  campaignId: int("campaign_id")
    .notNull()
    .references(() => emailCampaigns.id, { onDelete: "cascade" }),
  customerId: int("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, opened, clicked, converted
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"),
});

// ─── Inventory Waste Tracking ───────────────────────────────────────────────
export const wasteLogs = mysqlTable("waste_logs", {
  id: int("id").primaryKey().autoincrement(),
  ingredientId: int("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  reason: varchar("reason", { length: 50 }).notNull(), // spoilage, damage, theft, expiration, other
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  loggedBy: int("logged_by")
    .notNull()
    .references(() => staff.id),
  loggedAt: timestamp("logged_at").defaultNow(),
});

export const wasteReports = mysqlTable("waste_reports", {
  id: int("id").primaryKey().autoincrement(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalWasteCost: decimal("total_waste_cost", { precision: 12, scale: 2 }).notNull(),
  wasteCount: int("waste_count").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// ─── Multi-Location Support ─────────────────────────────────────────────────
export const locations = mysqlTable("locations", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email"),
  timezone: text("timezone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ─── Combo/Bundle Management ────────────────────────────────────────────────
export const combos = mysqlTable("combos", {
  id: int("id").primaryKey().autoincrement(),
  locationId: int("location_id").references(() => locations.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  regularPrice: decimal("regular_price", { precision: 10, scale: 2 }),
  discount: decimal("discount", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const comboItems = mysqlTable("combo_items", {
  id: int("id").primaryKey().autoincrement(),
  comboId: int("combo_id").notNull().references(() => combos.id),
  menuItemId: int("menu_item_id").notNull().references(() => menuItems.id),
  quantity: int("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Advanced Labour Management ─────────────────────────────────────────────
export const labourCompliance = mysqlTable("labour_compliance", {
  id: int("id").primaryKey().autoincrement(),
  locationId: int("location_id").references(() => locations.id),
  maxHoursPerWeek: int("max_hours_per_week").default(40),
  minBreakMinutes: int("min_break_minutes").default(30),
  overtimeThreshold: int("overtime_threshold").default(40),
  overtimeMultiplier: decimal("overtime_multiplier", { precision: 3, scale: 2 }).default("1.5"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const staffAvailability = mysqlTable("staff_availability", {
  id: int("id").primaryKey().autoincrement(),
  staffId: int("staff_id").notNull().references(() => staff.id),
  dayOfWeek: int("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeOffRequests = mysqlTable("time_off_requests", {
  id: int("id").primaryKey().autoincrement(),
  staffId: int("staff_id").notNull().references(() => staff.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: text("status").default("pending"), // pending, approved, rejected
  approvedBy: int("approved_by").references(() => staff.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const overtimeAlerts = mysqlTable("overtime_alerts", {
  id: int("id").primaryKey().autoincrement(),
  staffId: int("staff_id").notNull().references(() => staff.id),
  weekStartDate: timestamp("week_start_date").notNull(),
  totalHours: decimal("total_hours", { precision: 5, scale: 2 }).notNull(),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }).notNull(),
  alertSent: boolean("alert_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const labourBudget = mysqlTable("labour_budget", {
  id: int("id").primaryKey().autoincrement(),
  locationId: int("location_id").references(() => locations.id),
  month: int("month").notNull(),
  year: int("year").notNull(),
  budgetedHours: decimal("budgeted_hours", { precision: 7, scale: 2 }).notNull(),
  budgetedCost: decimal("budgeted_cost", { precision: 12, scale: 2 }).notNull(),
  actualHours: decimal("actual_hours", { precision: 7, scale: 2 }).default("0"),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Payment Integration
export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int().primaryKey().autoincrement(),
  orderId: int().references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  provider: varchar("provider", { length: 50 }), // stripe, square
  transactionId: varchar("transaction_id", { length: 255 }),
  status: varchar("status", { length: 50 }), // pending, completed, failed, refunded
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).default('0'),
  refundStatus: varchar("refund_status", { length: 50 }),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});

// Real-Time Notifications
export const notifications = mysqlTable("notifications", {
  id: int().primaryKey().autoincrement(),
  userId: int().references(() => users.id),
  title: varchar("title", { length: 255 }),
  message: text("message"),
  type: varchar("type", { length: 50 }), // order, stock, staff, system
  relatedId: int(),
  isRead: boolean().default(false),
  isArchived: boolean().default(false),
  createdAt: timestamp().defaultNow(),
});

export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int().primaryKey().autoincrement(),
  userId: int().references(() => users.id),
  newOrders: boolean().default(true),
  lowStock: boolean().default(true),
  staffAlerts: boolean().default(true),
  systemEvents: boolean().default(true),
});

// Recipe Costing Analysis
export const recipeCostHistory = mysqlTable("recipe_cost_history", {
  id: int().primaryKey().autoincrement(),
  recipeId: int().references(() => recipes.id),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  ingredientCount: int(),
  recordedAt: timestamp().defaultNow(),
});

// Supplier Performance Tracking
export const supplierPerformance = mysqlTable("supplier_performance", {
  id: int().primaryKey().autoincrement(),
  supplierId: int().references(() => suppliers.id),
  month: int(),
  year: int(),
  totalOrders: int().default(0),
  onTimeDeliveries: int().default(0),
  lateDeliveries: int().default(0),
  onTimeRate: decimal("on_time_rate", { precision: 5, scale: 2 }).default('0'),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }).default('0'),
  qualityRating: decimal("quality_rating", { precision: 3, scale: 1 }),
  notes: text("notes"),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().onUpdateNow(),
});

export const supplierPriceHistory = mysqlTable("supplier_price_history", {
  id: int().primaryKey().autoincrement(),
  supplierId: int().references(() => suppliers.id),
  ingredientId: int().references(() => ingredients.id),
  price: decimal("price", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  recordedAt: timestamp().defaultNow(),
});

// ─── Split Bills ─────────────────────────────────────────────────────
export const splitBills = mysqlTable("split_bills", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  splitType: mysqlEnum("splitType", ["equal", "by_item", "by_amount", "by_percentage"]).notNull(),
  totalParts: int("totalParts").default(2).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const splitBillParts = mysqlTable("split_bill_parts", {
  id: int("id").autoincrement().primaryKey(),
  splitBillId: int("splitBillId").notNull(),
  partNumber: int("partNumber").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tipAmount: decimal("tipAmount", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: mysqlEnum("paymentMethod", ["card", "cash", "online", "unpaid"]).default("unpaid"),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid"]).default("unpaid"),
  itemIds: json("itemIds"), // array of order item IDs for by_item splits
  paidAt: timestamp("paidAt"),
});

// ─── Discounts & Promotions ─────────────────────────────────────────
export const discounts = mysqlTable("discounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["percentage", "fixed", "bogo"]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }).default("0"),
  maxDiscountAmount: decimal("maxDiscountAmount", { precision: 10, scale: 2 }),
  requiresApproval: boolean("requiresApproval").default(false),
  approvalThreshold: decimal("approvalThreshold", { precision: 5, scale: 2 }).default("10"), // % threshold for manager approval
  isActive: boolean("isActive").default(true).notNull(),
  validFrom: timestamp("validFrom"),
  validTo: timestamp("validTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export const orderDiscounts = mysqlTable("order_discounts", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  discountId: int("discountId"),
  discountName: varchar("discountName", { length: 255 }).notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed", "bogo", "manual"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Payment Disputes ───────────────────────────────────────────────
export const paymentDisputes = mysqlTable("payment_disputes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  transactionId: int("transactionId"),
  disputeType: mysqlEnum("disputeType", ["chargeback", "inquiry", "fraud", "duplicate", "other"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["open", "under_review", "won", "lost", "closed"]).default("open").notNull(),
  reason: text("reason"),
  evidence: text("evidence"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Location Menu Prices ───────────────────────────────────────────
export const locationMenuPrices = mysqlTable("location_menu_prices", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  menuItemId: int("menuItemId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Table Merges ───────────────────────────────────────────────────
export const tableMerges = mysqlTable("table_merges", {
  id: int("id").autoincrement().primaryKey(),
  primaryTableId: int("primaryTableId").notNull(),
  mergedTableIds: json("mergedTableIds").notNull(), // array of table IDs
  mergedBy: int("mergedBy"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  unmergedAt: timestamp("unmergedAt"),
});


// ─── Module 5.9: Settings & Configuration ───────────────────────────
// ─── System Settings ────────────────────────────────────────────────
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  restaurantName: varchar("restaurantName", { length: 255 }),
  restaurantLogo: text("restaurantLogo"), // URL to logo
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  language: varchar("language", { length: 10 }).default("en"),
  dateFormat: varchar("dateFormat", { length: 20 }).default("MM/DD/YYYY"),
  timeFormat: varchar("timeFormat", { length: 20 }).default("12h"),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0"),
  businessLicense: varchar("businessLicense", { length: 255 }),
  businessPhone: varchar("businessPhone", { length: 32 }),
  businessEmail: varchar("businessEmail", { length: 320 }),
  businessAddress: text("businessAddress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = typeof systemSettings.$inferInsert;

// ─── User Preferences ───────────────────────────────────────────────
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  theme: mysqlEnum("theme", ["light", "dark", "auto"]).default("auto"),
  language: varchar("language", { length: 10 }).default("en"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  sidebarCollapsed: boolean("sidebarCollapsed").default(false),
  compactMode: boolean("compactMode").default(false),
  showNotifications: boolean("showNotifications").default(true),
  soundEnabled: boolean("soundEnabled").default(true),
  emailDigest: mysqlEnum("emailDigest", ["none", "daily", "weekly", "monthly"]).default("weekly"),
  defaultLocation: int("defaultLocation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

// ─── Email Settings ─────────────────────────────────────────────────
export const emailSettings = mysqlTable("email_settings", {
  id: int("id").autoincrement().primaryKey(),
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort").default(587),
  smtpUser: varchar("smtpUser", { length: 255 }),
  smtpPassword: text("smtpPassword"), // encrypted
  fromEmail: varchar("fromEmail", { length: 320 }),
  fromName: varchar("fromName", { length: 255 }),
  isEnabled: boolean("isEnabled").default(false),
  useTLS: boolean("useTLS").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = typeof emailSettings.$inferInsert;

// ─── Payment Settings ───────────────────────────────────────────────
export const paymentSettings = mysqlTable("payment_settings", {
  id: int("id").autoincrement().primaryKey(),
  stripePublishableKey: varchar("stripePublishableKey", { length: 255 }),
  stripeSecretKey: text("stripeSecretKey"), // encrypted
  stripeEnabled: boolean("stripeEnabled").default(false),
  squareAccessToken: text("squareAccessToken"), // encrypted
  squareEnabled: boolean("squareEnabled").default(false),
  paypalClientId: varchar("paypalClientId", { length: 255 }),
  paypalClientSecret: text("paypalClientSecret"), // encrypted
  paypalEnabled: boolean("paypalEnabled").default(false),
  cashPaymentEnabled: boolean("cashPaymentEnabled").default(true),
  checkPaymentEnabled: boolean("checkPaymentEnabled").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = typeof paymentSettings.$inferInsert;

// ─── Delivery Settings ──────────────────────────────────────────────
export const deliverySettings = mysqlTable("delivery_settings", {
  id: int("id").autoincrement().primaryKey(),
  internalDeliveryEnabled: boolean("internalDeliveryEnabled").default(false),
  thirdPartyDeliveryEnabled: boolean("thirdPartyDeliveryEnabled").default(false),
  defaultDeliveryFee: decimal("defaultDeliveryFee", { precision: 10, scale: 2 }).default("0"),
  minOrderForDelivery: decimal("minOrderForDelivery", { precision: 10, scale: 2 }).default("0"),
  maxDeliveryDistance: int("maxDeliveryDistance").default(10), // in miles/km
  deliveryTimeEstimate: int("deliveryTimeEstimate").default(30), // in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliverySettings = typeof deliverySettings.$inferSelect;
export type InsertDeliverySettings = typeof deliverySettings.$inferInsert;

// ─── Receipt Settings ───────────────────────────────────────────────
export const receiptSettings = mysqlTable("receipt_settings", {
  id: int("id").autoincrement().primaryKey(),
  receiptHeader: text("receiptHeader"),
  receiptFooter: text("receiptFooter"),
  showItemDescription: boolean("showItemDescription").default(true),
  showItemPrice: boolean("showItemPrice").default(true),
  showTaxBreakdown: boolean("showTaxBreakdown").default(true),
  showDiscounts: boolean("showDiscounts").default(true),
  showPaymentMethod: boolean("showPaymentMethod").default(true),
  showServerName: boolean("showServerName").default(true),
  showTableNumber: boolean("showTableNumber").default(true),
  printLogo: boolean("printLogo").default(true),
  receiptWidth: int("receiptWidth").default(80), // characters
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReceiptSettings = typeof receiptSettings.$inferSelect;
export type InsertReceiptSettings = typeof receiptSettings.$inferInsert;

// ─── Security Settings ──────────────────────────────────────────────
export const securitySettings = mysqlTable("security_settings", {
  id: int("id").autoincrement().primaryKey(),
  twoFactorAuthEnabled: boolean("twoFactorAuthEnabled").default(false),
  ssoEnabled: boolean("ssoEnabled").default(false),
  ssoProvider: varchar("ssoProvider", { length: 64 }), // "okta", "azure", "google", etc.
  sessionTimeout: int("sessionTimeout").default(3600), // in seconds
  passwordMinLength: int("passwordMinLength").default(8),
  passwordRequireUppercase: boolean("passwordRequireUppercase").default(true),
  passwordRequireNumbers: boolean("passwordRequireNumbers").default(true),
  passwordRequireSpecialChars: boolean("passwordRequireSpecialChars").default(true),
  passwordExpiryDays: int("passwordExpiryDays").default(90),
  ipWhitelistEnabled: boolean("ipWhitelistEnabled").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecuritySettings = typeof securitySettings.$inferSelect;
export type InsertSecuritySettings = typeof securitySettings.$inferInsert;

// ─── API Keys ───────────────────────────────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  lastUsed: timestamp("lastUsed"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

// ─── Audit Log Settings ─────────────────────────────────────────────
export const auditLogSettings = mysqlTable("audit_log_settings", {
  id: int("id").autoincrement().primaryKey(),
  enableAuditLogging: boolean("enableAuditLogging").default(true),
  logUserActions: boolean("logUserActions").default(true),
  logDataChanges: boolean("logDataChanges").default(true),
  logLoginAttempts: boolean("logLoginAttempts").default(true),
  logPayments: boolean("logPayments").default(true),
  retentionDays: int("retentionDays").default(90),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuditLogSettings = typeof auditLogSettings.$inferSelect;
export type InsertAuditLogSettings = typeof auditLogSettings.$inferInsert;

// ─── Backup Settings ────────────────────────────────────────────────
export const backupSettings = mysqlTable("backup_settings", {
  id: int("id").autoincrement().primaryKey(),
  autoBackupEnabled: boolean("autoBackupEnabled").default(true),
  backupFrequency: mysqlEnum("backupFrequency", ["hourly", "daily", "weekly", "monthly"]).default("daily"),
  backupTime: varchar("backupTime", { length: 5 }).default("02:00"), // HH:MM
  retentionDays: int("retentionDays").default(30),
  s3BucketName: varchar("s3BucketName", { length: 255 }),
  s3Enabled: boolean("s3Enabled").default(false),
  lastBackupAt: timestamp("lastBackupAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BackupSettings = typeof backupSettings.$inferSelect;
export type InsertBackupSettings = typeof backupSettings.$inferInsert;

// ─── Localization Settings ──────────────────────────────────────────
export const localizationSettings = mysqlTable("localization_settings", {
  id: int("id").autoincrement().primaryKey(),
  language: varchar("language", { length: 10 }).notNull(),
  languageName: varchar("languageName", { length: 64 }).notNull(),
  isEnabled: boolean("isEnabled").default(true),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LocalizationSettings = typeof localizationSettings.$inferSelect;
export type InsertLocalizationSettings = typeof localizationSettings.$inferInsert;

// ─── Currency Settings ──────────────────────────────────────────────
export const currencySettings = mysqlTable("currency_settings", {
  id: int("id").autoincrement().primaryKey(),
  currencyCode: varchar("currencyCode", { length: 3 }).notNull().unique(),
  currencyName: varchar("currencyName", { length: 64 }).notNull(),
  currencySymbol: varchar("currencySymbol", { length: 10 }).notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 10, scale: 4 }).default("1"),
  isEnabled: boolean("isEnabled").default(true),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CurrencySettings = typeof currencySettings.$inferSelect;
export type InsertCurrencySettings = typeof currencySettings.$inferInsert;


// ─── Integrations ───────────────────────────────────────────────────
export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["slack", "teams", "quickbooks", "stripe", "square", "paypal", "uber_eats", "doordash", "grubhub", "webhook", "toast", "xtra_chef"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  apiKey: text("apiKey"),
  apiSecret: text("apiSecret"),
  webhookUrl: text("webhookUrl"),
  webhookSecret: text("webhookSecret"),
  config: text("config"), // JSON configuration
  lastSyncAt: timestamp("lastSyncAt"),
  lastErrorAt: timestamp("lastErrorAt"),
  lastErrorMessage: text("lastErrorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

// ─── Integration Logs ───────────────────────────────────────────────
export const integrationLogs = mysqlTable("integration_logs", {
  id: int("id").autoincrement().primaryKey(),
  integrationId: int("integrationId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // sync, webhook, error
  status: mysqlEnum("status", ["success", "failed", "pending"]).default("pending"),
  message: text("message"),
  requestData: text("requestData"), // JSON
  responseData: text("responseData"), // JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IntegrationLog = typeof integrationLogs.$inferSelect;
export type InsertIntegrationLog = typeof integrationLogs.$inferInsert;

// ─── Custom Reports ─────────────────────────────────────────────────
export const customReports = mysqlTable("custom_reports", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["sales", "inventory", "labour", "customer", "financial", "custom"]).notNull(),
  filters: text("filters"), // JSON
  columns: text("columns"), // JSON array of column names
  sortBy: varchar("sortBy", { length: 64 }),
  sortOrder: mysqlEnum("sortOrder", ["asc", "desc"]).default("asc"),
  isPublic: boolean("isPublic").default(false),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CustomReport = typeof customReports.$inferSelect;
export type InsertCustomReport = typeof customReports.$inferInsert;

// ─── Report Exports ─────────────────────────────────────────────────
export const reportExports = mysqlTable("report_exports", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  format: mysqlEnum("format", ["pdf", "excel", "csv", "json"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending"),
  exportedBy: int("exportedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportExport = typeof reportExports.$inferSelect;
export type InsertReportExport = typeof reportExports.$inferInsert;

// ─── Analytics Dashboard ────────────────────────────────────────────
export const analyticsDashboard = mysqlTable("analytics_dashboard", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  widgets: text("widgets"), // JSON array of widget configurations
  refreshInterval: int("refreshInterval").default(300), // seconds
  isDefault: boolean("isDefault").default(false),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AnalyticsDashboard = typeof analyticsDashboard.$inferSelect;
export type InsertAnalyticsDashboard = typeof analyticsDashboard.$inferInsert;

// ─── KPI Metrics ────────────────────────────────────────────────────
export const kpiMetrics = mysqlTable("kpi_metrics", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).default("0"),
  totalOrders: int("totalOrders").default(0),
  averageOrderValue: decimal("averageOrderValue", { precision: 10, scale: 2 }).default("0"),
  customerCount: int("customerCount").default(0),
  newCustomers: int("newCustomers").default(0),
  repeatCustomers: int("repeatCustomers").default(0),
  labourCost: decimal("labourCost", { precision: 12, scale: 2 }).default("0"),
  foodCost: decimal("foodCost", { precision: 12, scale: 2 }).default("0"),
  primeCost: decimal("primeCost", { precision: 10, scale: 2 }).default("0"),
  netProfit: decimal("netProfit", { precision: 12, scale: 2 }).default("0"),
  profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KPIMetric = typeof kpiMetrics.$inferSelect;
export type InsertKPIMetric = typeof kpiMetrics.$inferInsert;

// ─── Forecasting Data ───────────────────────────────────────────────
export const forecastingData = mysqlTable("forecasting_data", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  dayOfWeek: varchar("dayOfWeek", { length: 10 }).notNull(),
  forecastedRevenue: decimal("forecastedRevenue", { precision: 12, scale: 2 }).default("0"),
  actualRevenue: decimal("actualRevenue", { precision: 12, scale: 2 }),
  forecastedOrders: int("forecastedOrders").default(0),
  actualOrders: int("actualOrders"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).default("0"), // 0-100
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }), // after actual is known
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ForecastingData = typeof forecastingData.$inferSelect;
export type InsertForecastingData = typeof forecastingData.$inferInsert;

// ─── Data Import Jobs ───────────────────────────────────────────────
export const dataImportJobs = mysqlTable("data_import_jobs", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'menu', 'customers', 'inventory', etc.
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  fileUrl: text("fileUrl"), // URL to the uploaded file in blob storage
  totalRecords: int("totalRecords").default(0),
  processedRecords: int("processedRecords").default(0),
  failedRecords: int("failedRecords").default(0),
  errorMessage: text("errorMessage"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DataImportJob = typeof dataImportJobs.$inferSelect;
export type InsertDataImportJob = typeof dataImportJobs.$inferInsert;
