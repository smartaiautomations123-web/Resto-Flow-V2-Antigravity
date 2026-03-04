import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import OrderStatus from "@/pages/OrderStatus";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import KDS from "./pages/KDS";
import MenuManagement from "./pages/MenuManagement";
import ComboBuilder from "./pages/ComboBuilder";
import { DaypartManagement } from "@/pages/DaypartManagement";
import Inventory from "./pages/Inventory";
import WasteTracking from "@/pages/WasteTracking";
import RecipeAnalysis from "./pages/RecipeAnalysis";
import StaffManagement from "./pages/StaffManagement";
import LabourManagement from "./pages/LabourManagement";
import Reports from "./pages/Reports";
import Profitability from "./pages/Profitability";
import ZReports from "./pages/ZReports";
import Suppliers from "./pages/Suppliers";
import SupplierTracking from "./pages/SupplierTracking";
import PriceUploads from "./pages/PriceUploads";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import CustomerSegments from "./pages/CustomerSegments";
import Reservations from "./pages/Reservations";
import Waitlist from "./pages/Waitlist";
import OnlineOrdering from "./pages/OnlineOrdering";
import TableOrdering from "./pages/TableOrdering";
import FloorPlan from "./pages/FloorPlan";
import VoidRefunds from "./pages/VoidRefunds";
import VoidReasonAnalytics from "@/pages/VoidReasonAnalytics";
import QRCodeGenerator from "./pages/QRCodeGenerator";
import OrderHistory from "./pages/OrderHistory";
import PaymentManagement from "./pages/PaymentManagement";
import { SmsSettings } from "@/pages/SmsSettings";
import { EmailCampaigns } from "@/pages/EmailCampaigns";
import NotificationCenter from "./pages/NotificationCenter";
import LocationManagement from "./pages/LocationManagement";
import PaymentDisputes from "./pages/PaymentDisputes";
import LocationPricing from "./pages/LocationPricing";
import UnifiedOrderQueue from "./pages/UnifiedOrderQueue";
const OrderQueue = UnifiedOrderQueue; // Alias for backward compatibility
import Settings from "./pages/Settings";
import Integrations from "./pages/Integrations";
import DataImports from "./pages/DataImports";
import CustomReportBuilder from "./pages/CustomReportBuilder";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import SalesForecasting from "./pages/SalesForecasting";
import AuthPage from "./pages/Auth";

function Router() {
  return (
    <Switch>
      {/* Public routes (no dashboard layout) */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/order" component={OnlineOrdering} />
      <Route path="/table/:tableId" component={TableOrdering} />
      <Route path="/order-status" component={OrderStatus} />

      {/* ─── Dashboard ─────────────────────────────────────── */}
      <Route path="/" component={() => <DashboardLayout><Dashboard /></DashboardLayout>} />

      {/* ─── POS & Orders ──────────────────────────────────── */}
      <Route path="/pos" component={() => <DashboardLayout><POS /></DashboardLayout>} />
      <Route path="/kds" component={() => <DashboardLayout><KDS /></DashboardLayout>} />
      <Route path="/order-history" component={() => <DashboardLayout><OrderHistory /></DashboardLayout>} />
      <Route path="/void-refunds" component={() => <DashboardLayout><VoidRefunds /></DashboardLayout>} />
      <Route path="/void-reasons" component={() => <DashboardLayout><VoidReasonAnalytics /></DashboardLayout>} />
      <Route path="/payments" component={() => <DashboardLayout><PaymentManagement /></DashboardLayout>} />
      <Route path="/payment-disputes" component={() => <DashboardLayout><PaymentDisputes /></DashboardLayout>} />
      <Route path="/order-queue" component={() => <DashboardLayout><OrderQueue /></DashboardLayout>} />
      <Route path="/unified-order-queue" component={() => <DashboardLayout><UnifiedOrderQueue /></DashboardLayout>} />

      {/* ─── Menu & Recipes ────────────────────────────────── */}
      <Route path="/menu" component={() => <DashboardLayout><MenuManagement /></DashboardLayout>} />
      <Route path="/combos" component={() => <DashboardLayout><ComboBuilder /></DashboardLayout>} />
      <Route path="/dayparts" component={() => <DashboardLayout><DaypartManagement /></DashboardLayout>} />
      <Route path="/recipe-analysis" component={() => <DashboardLayout><RecipeAnalysis /></DashboardLayout>} />

      {/* ─── Inventory & Suppliers ─────────────────────────── */}
      <Route path="/inventory" component={() => <DashboardLayout><Inventory /></DashboardLayout>} />
      <Route path="/waste-tracking" component={() => <DashboardLayout><WasteTracking /></DashboardLayout>} />
      <Route path="/suppliers" component={() => <DashboardLayout><Suppliers /></DashboardLayout>} />
      <Route path="/supplier-tracking" component={() => <DashboardLayout><SupplierTracking /></DashboardLayout>} />
      <Route path="/price-uploads" component={() => <DashboardLayout><PriceUploads /></DashboardLayout>} />

      {/* ─── Staff & Labour ────────────────────────────────── */}
      <Route path="/staff" component={() => <DashboardLayout><StaffManagement /></DashboardLayout>} />
      <Route path="/labour" component={() => <DashboardLayout><LabourManagement /></DashboardLayout>} />

      {/* ─── Customers & CRM ───────────────────────────────── */}
      <Route path="/customers" component={() => <DashboardLayout><Customers /></DashboardLayout>} />
      <Route path="/customers/:customerId" component={() => <DashboardLayout><CustomerDetail /></DashboardLayout>} />
      <Route path="/segments" component={() => <DashboardLayout><CustomerSegments /></DashboardLayout>} />
      <Route path="/sms-settings" component={() => <DashboardLayout><SmsSettings /></DashboardLayout>} />
      <Route path="/email-campaigns" component={() => <DashboardLayout><EmailCampaigns /></DashboardLayout>} />

      {/* ─── Reservations & Floor ──────────────────────────── */}
      <Route path="/reservations" component={() => <DashboardLayout><Reservations /></DashboardLayout>} />
      <Route path="/waitlist" component={() => <DashboardLayout><Waitlist /></DashboardLayout>} />
      <Route path="/floor-plan" component={() => <DashboardLayout><FloorPlan /></DashboardLayout>} />
      <Route path="/qr-codes" component={() => <DashboardLayout><QRCodeGenerator /></DashboardLayout>} />

      {/* ─── Reports & Analytics ───────────────────────────── */}
      <Route path="/reports" component={() => <DashboardLayout><Reports /></DashboardLayout>} />
      <Route path="/profitability" component={() => <DashboardLayout><Profitability /></DashboardLayout>} />
      <Route path="/z-reports" component={() => <DashboardLayout><ZReports /></DashboardLayout>} />
      <Route path="/custom-reports" component={() => <DashboardLayout><CustomReportBuilder /></DashboardLayout>} />
      <Route path="/analytics" component={() => <DashboardLayout><AnalyticsDashboard /></DashboardLayout>} />
      <Route path="/sales-forecasting" component={() => <DashboardLayout><SalesForecasting /></DashboardLayout>} />

      {/* ─── Settings & Admin ─────────────────────── */}
      <Route path="/settings" component={() => <DashboardLayout><Settings /></DashboardLayout>} />
      <Route path="/integrations" component={() => <DashboardLayout><Integrations /></DashboardLayout>} />
      <Route path="/data-imports" component={() => <DashboardLayout><DataImports /></DashboardLayout>} />
      <Route path="/notifications" component={() => <DashboardLayout><NotificationCenter /></DashboardLayout>} />
      <Route path="/locations" component={() => <DashboardLayout><LocationManagement /></DashboardLayout>} />
      <Route path="/location-pricing" component={() => <DashboardLayout><LocationPricing /></DashboardLayout>} />

      {/* ─── Fallback ──────────────────────────────────────── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
