import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, ShoppingCart, ChefHat, UtensilsCrossed,
  Package, Users, BarChart3, Truck, Heart, CalendarDays,
  LogOut, PanelLeft, Flame, Upload, Grid3x3, Receipt, AlertCircle, QrCode, Clock, TrendingUp, Zap,
  History, CreditCard, Layers, FlaskConical, Trash2, ClipboardList,
  Briefcase, Mail, MessageSquare, Bell, MapPin, ChevronDown, ChevronRight,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: any;
  items: MenuItem[];
  dividers?: number[];
}

const menuGroups: MenuGroup[] = [
  // ─── Dashboard ───
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
    ],
  },

  // ─── Sales & Orders ───
  {
    id: "sales",
    label: "Sales & Orders",
    icon: ShoppingCart,
    items: [
      { icon: ShoppingCart, label: "POS", path: "/pos" },
      { icon: ChefHat, label: "Kitchen (KDS)", path: "/kds" },
      { icon: History, label: "Order History", path: "/order-history" },
      { icon: LayoutDashboard, label: "Order Queue", path: "/order-queue" },
      { icon: AlertCircle, label: "Void & Refunds", path: "/void-refunds" },
      { icon: ClipboardList, label: "Void Reasons", path: "/void-reasons" },
      { icon: CreditCard, label: "Payments", path: "/payments" },
      { icon: AlertCircle, label: "Disputes", path: "/payment-disputes" },
    ],
    dividers: [3, 5],
  },

  // ─── Menu & Recipes ───
  {
    id: "menu",
    label: "Menu & Recipes",
    icon: UtensilsCrossed,
    items: [
      { icon: UtensilsCrossed, label: "Menu", path: "/menu" },
      { icon: Layers, label: "Combos", path: "/combos" },
      { icon: Clock, label: "Dayparts", path: "/dayparts" },
      { icon: FlaskConical, label: "Recipe Analysis", path: "/recipe-analysis" },
    ],
  },

  // ─── Inventory & Supply Chain ───
  {
    id: "inventory",
    label: "Inventory & Supply",
    icon: Package,
    items: [
      { icon: Package, label: "Inventory", path: "/inventory" },
      { icon: Trash2, label: "Waste Tracking", path: "/waste-tracking" },
      { icon: Truck, label: "Suppliers", path: "/suppliers" },
      { icon: BarChart3, label: "Supplier Tracking", path: "/supplier-tracking" },
      { icon: Upload, label: "Price Uploads", path: "/price-uploads" },
    ],
    dividers: [1],
  },

  // ─── Staff & Operations ───
  {
    id: "staff",
    label: "Staff & Operations",
    icon: Users,
    items: [
      { icon: Users, label: "Staff", path: "/staff" },
      { icon: Briefcase, label: "Labour", path: "/labour" },
    ],
  },

  // ─── Customers & Marketing ───
  {
    id: "customers",
    label: "Customers & Marketing",
    icon: Heart,
    items: [
      { icon: Heart, label: "Customers", path: "/customers" },
      { icon: Zap, label: "Segments", path: "/segments" },
      { icon: MessageSquare, label: "SMS Campaigns", path: "/sms-settings" },
      { icon: Mail, label: "Email Campaigns", path: "/email-campaigns" },
    ],
    dividers: [2],
  },

  // ─── Reservations & Seating ───
  {
    id: "reservations",
    label: "Reservations & Seating",
    icon: CalendarDays,
    items: [
      { icon: CalendarDays, label: "Reservations", path: "/reservations" },
      { icon: Clock, label: "Waitlist", path: "/waitlist" },
      { icon: Grid3x3, label: "Floor Plan", path: "/floor-plan" },
      { icon: QrCode, label: "QR Codes", path: "/qr-codes" },
    ],
  },

  // ─── Reports & Analytics ───
  {
    id: "reports",
    label: "Reports & Analytics",
    icon: BarChart3,
    items: [
      { icon: BarChart3, label: "Reports", path: "/reports" },
      { icon: TrendingUp, label: "Profitability", path: "/profitability" },
      { icon: Receipt, label: "Z-Reports", path: "/z-reports" },
      { icon: BarChart3, label: "Custom Reports", path: "/custom-reports" },
      { icon: TrendingUp, label: "Analytics Dashboard", path: "/analytics" },
    ],
  },

  // ─── Settings & Admin ───
  {
    id: "settings",
    label: "Settings & Admin",
    icon: MapPin,
    items: [
      { icon: LayoutDashboard, label: "System Settings", path: "/settings" },
      { icon: Zap, label: "Integrations", path: "/integrations" },
      { icon: Upload, label: "Data Imports", path: "/data-imports" },
      { icon: MapPin, label: "Locations", path: "/locations" },
      { icon: CreditCard, label: "Location Pricing", path: "/location-pricing" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const EXPANDED_GROUPS_KEY = "expanded-groups";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tight">RestoFlow</span>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sign in to access your restaurant management dashboard.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Initialize expanded groups from localStorage
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(EXPANDED_GROUPS_KEY);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set(["dashboard", "sales"]);
      }
    }
    return new Set(["dashboard", "sales"]);
  });

  // Auto-expand group if active item is in it
  useEffect(() => {
    for (const group of menuGroups) {
      const hasActiveItem = group.items.some(item => item.path === location);
      if (hasActiveItem && !expandedGroups.has(group.id)) {
        setExpandedGroups(prev => {
          const updated = new Set(prev);
          updated.add(group.id);
          localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(Array.from(updated)));
          return updated;
        });
      }
    }
  }, [location, expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const updated = new Set(prev);
      if (updated.has(groupId)) {
        updated.delete(groupId);
      } else {
        updated.add(groupId);
      }
      localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(Array.from(updated)));
      return updated;
    });
  };

  // Find active menu item for mobile header
  const activeMenuItem = menuGroups
    .flatMap(g => g.items)
    .find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0">
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Flame className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-bold tracking-tight truncate text-foreground">RestoFlow</span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            <SidebarMenu className="px-2 py-1">
              {menuGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                const hasActiveItem = group.items.some(item => item.path === location);
                const isSingleItem = group.items.length === 1;

                // For single-item groups (like Dashboard), show item directly
                if (isSingleItem && !isCollapsed) {
                  const item = group.items[0];
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={group.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className="h-10 transition-all font-normal"
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // For multi-item groups, show collapsible header
                return (
                  <div key={group.id}>
                    {/* Group Header */}
                    <SidebarMenuItem>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm group-data-[collapsible=icon]:justify-center ${hasActiveItem
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          }`}
                        aria-expanded={isExpanded}
                      >
                        <group.icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-left">{group.label}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </>
                        )}
                      </button>
                    </SidebarMenuItem>

                    {/* Group Items */}
                    {isExpanded && !isCollapsed && (
                      <div className="pl-2 space-y-0.5">
                        {group.items.map((item, index) => {
                          const isActive = location === item.path;
                          const showDivider = group.dividers?.includes(index);

                          return (
                            <div key={item.path}>
                              {showDivider && (
                                <div className="my-1 border-t border-border/30" />
                              )}
                              <SidebarMenuItem>
                                <SidebarMenuButton
                                  isActive={isActive}
                                  onClick={() => setLocation(item.path)}
                                  tooltip={item.label}
                                  className="h-9 text-xs pl-4 transition-all font-normal"
                                >
                                  <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
                                  <span>{item.label}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "-"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (isCollapsed) return; setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground font-medium">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
