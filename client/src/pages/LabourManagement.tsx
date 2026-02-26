import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertTriangle, Clock, ShieldCheck, Award, Users, TrendingUp,
  Calendar, CheckCircle, XCircle, Star, Sparkles
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const today = new Date();
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay() + 1);

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function LabourManagement() {
  const { data: staffList } = trpc.staff.list.useQuery();
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const startDate = toDateStr(startOfWeek);
  const endDate = toDateStr(today);

  const { data: timesheetSummary } = trpc.timesheet.getTimesheetSummary.useQuery({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  const staffId = selectedStaffId ? Number(selectedStaffId) : undefined;

  const { data: aiInsights, isLoading: loadingAi } = trpc.labourManagement.getSmartScheduleInsights.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  const { data: certAlerts } = trpc.labourManagement.certificationAlerts.useQuery({ daysUntilExpiry: 30 });
  const { data: tipPooling } = trpc.labourManagement.tipPooling.useQuery({ locationId: undefined });
  const { data: wageTheft } = trpc.labourManagement.wageTheftPrevention.useQuery();
  // compliance and overtimeAlerts come from timesheet summary — no separate router endpoint
  const complianceData: unknown = undefined;
  const overtimeAlerts: unknown[] = [];
  const { data: staffStats } = trpc.timesheet.getStaffStats.useQuery(
    { staffId: Number(selectedStaffId), startDate: new Date(startDate), endDate: new Date(endDate) },
    { enabled: !!selectedStaffId }
  );

  // Build chart data from timesheet summary
  const chartData = timesheetSummary
    ? Object.entries(
      (timesheetSummary as any)?.byStaff ?? {}
    ).map(([name, hours]: [string, any]) => ({ name: name.split(" ")[0], hours: Number(hours).toFixed(1) }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Labour Management</h1>
          <p className="text-muted-foreground mt-1">Monitor workforce compliance, overtime, and certifications.</p>
        </div>
      </div>

      {/* AI Smart Insight */}
      <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] border-[#333333] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-6">
          <div className="flex items-start gap-4 relaitve z-10">
            <div className="min-w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                AI Scheduling Optimization
                {loadingAi && <span className="text-xs font-normal text-primary/70 animate-pulse bg-primary/10 px-2 py-0.5 rounded-full">Analyzing...</span>}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                {loadingAi ? "Analyzing shift coverage, overtime risks, and compliance to suggest schedule optimizations..." : (typeof aiInsights?.insight === 'string' ? aiInsights.insight : "Connecting to scheduling engine...")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold">{staffList?.filter(s => s.isActive).length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cert Expiries</p>
                <p className="text-2xl font-bold">{(certAlerts as any)?.alerts?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold">{complianceData ? "Active" : "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">OT Alerts</p>
                <p className="text-2xl font-bold">{(overtimeAlerts as any[])?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><TrendingUp className="h-4 w-4 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="compliance"><ShieldCheck className="h-4 w-4 mr-1" />Compliance</TabsTrigger>
          <TabsTrigger value="overtime"><AlertTriangle className="h-4 w-4 mr-1" />Overtime</TabsTrigger>
          <TabsTrigger value="certifications"><Award className="h-4 w-4 mr-1" />Certifications</TabsTrigger>
          <TabsTrigger value="staff"><Users className="h-4 w-4 mr-1" />Staff Detail</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Weekly Hours by Staff</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                    No timesheet data for this week
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Tip Pooling Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {tipPooling ? (
                  <div className="space-y-3">
                    {(tipPooling as any)?.poolMembers?.map((pool: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div>
                          <p className="font-medium text-sm">{pool.staffName || pool.name}</p>
                          <p className="text-xs text-muted-foreground">{pool.role || "Staff"}</p>
                        </div>
                        <p className="font-semibold text-success">${Number(pool.tipAmount || pool.amount || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                    No tip pooling data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Wage theft prevention */}
          {wageTheft && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-success" /> Wage Theft Prevention Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(wageTheft as any)?.anomalies?.length > 0 ? (
                  <div className="space-y-2">
                    {(wageTheft as any)?.anomalies?.map((flag: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{flag.description || flag.issue}</p>
                          <p className="text-xs text-muted-foreground">{flag.staffName} — {flag.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-success text-sm py-2">
                    <CheckCircle className="h-4 w-4" /> No wage theft flags detected
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Compliance ── */}
        <TabsContent value="compliance" className="space-y-4 mt-4">
          {complianceData ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">Compliance Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-4 rounded-lg bg-accent/30 text-center">
                    <p className="text-sm text-muted-foreground">Max Hours/Week</p>
                    <p className="text-3xl font-bold mt-1">{(complianceData as any).maxHoursPerWeek}h</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 text-center">
                    <p className="text-sm text-muted-foreground">Min Break</p>
                    <p className="text-3xl font-bold mt-1">{(complianceData as any).minBreakMinutes}m</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 text-center">
                    <p className="text-sm text-muted-foreground">OT Threshold</p>
                    <p className="text-3xl font-bold mt-1">{(complianceData as any).overtimeThreshold}h</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 text-center">
                    <p className="text-sm text-muted-foreground">OT Multiplier</p>
                    <p className="text-3xl font-bold mt-1">{(complianceData as any).overtimeMultiplier}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                <ShieldCheck className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No compliance configuration found. Configure compliance rules in Settings.
              </CardContent>
            </Card>
          )}

          {/* Timesheet summary table */}
          {timesheetSummary && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base">This Week's Timesheet Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Staff</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Regular Hours</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Overtime</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Pay</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(timesheetSummary as any)?.entries?.map?.((entry: any) => (
                      <tr key={entry.staffId} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="p-4 font-medium text-sm">{entry.staffName}</td>
                        <td className="p-4 text-sm">{Number(entry.regularHours || 0).toFixed(1)}h</td>
                        <td className="p-4 text-sm">
                          {Number(entry.overtimeHours || 0) > 0 ? (
                            <span className="text-destructive font-medium">{Number(entry.overtimeHours).toFixed(1)}h</span>
                          ) : "0h"}
                        </td>
                        <td className="p-4 text-sm font-medium">${Number(entry.totalPay || 0).toFixed(2)}</td>
                        <td className="p-4">
                          <Badge className={Number(entry.overtimeHours || 0) > 0 ? "badge-danger" : "badge-success"}>
                            {Number(entry.overtimeHours || 0) > 0 ? "Overtime" : "Normal"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!Array.isArray(timesheetSummary) && (
                  <p className="text-muted-foreground text-sm text-center py-6">No timesheet entries this week.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Overtime ── */}
        <TabsContent value="overtime" className="space-y-4 mt-4">
          {(overtimeAlerts as any[])?.length > 0 ? (
            (overtimeAlerts as any[]).map((alert: any) => (
              <Card key={alert.id} className="bg-card border-border border-l-4 border-l-destructive">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{alert.staffName || `Staff #${alert.staffId}`}</p>
                        <Badge className="badge-danger">Overtime</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Hours</p>
                          <p className="font-bold text-lg">{Number(alert.totalHours).toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Overtime Hours</p>
                          <p className="font-bold text-lg text-destructive">{Number(alert.overtimeHours).toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Extra Cost</p>
                          <p className="font-bold text-lg text-destructive">${Number(alert.extraCost || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success opacity-60" />
                <p className="font-medium">No overtime alerts</p>
                <p className="text-muted-foreground text-sm mt-1">All staff are within their scheduled hours.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Certifications ── */}
        <TabsContent value="certifications" className="space-y-4 mt-4">
          {(certAlerts as any)?.alerts?.length > 0 ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-medium">
                  {(certAlerts as any)?.alerts?.length} certification(s) expiring within 30 days
                </p>
              </div>
              <div className="grid gap-3">
                {(certAlerts as any)?.alerts?.map((cert: any, idx: number) => {
                  const daysLeft = cert.daysUntilExpiry ?? cert.daysLeft ?? 0;
                  return (
                    <Card key={idx} className="bg-card border-border">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <Award className={`h-5 w-5 shrink-0 mt-0.5 ${daysLeft <= 7 ? "text-destructive" : "text-warning"}`} />
                            <div>
                              <p className="font-medium">{cert.certificationName || cert.name}</p>
                              <p className="text-sm text-muted-foreground">{cert.staffName}</p>
                              <p className="text-xs text-muted-foreground mt-1">Expires: {cert.expiryDate || cert.expiry}</p>
                            </div>
                          </div>
                          <Badge className={daysLeft <= 7 ? "badge-danger" : "badge-warning"}>
                            {daysLeft}d left
                          </Badge>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Time remaining</span>
                            <span>{daysLeft} / 30 days</span>
                          </div>
                          <Progress value={(daysLeft / 30) * 100} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Award className="h-10 w-10 mx-auto mb-3 text-success opacity-60" />
                <p className="font-medium">All certifications up to date</p>
                <p className="text-muted-foreground text-sm mt-1">No certifications expiring in the next 30 days.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Staff Detail ── */}
        <TabsContent value="staff" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffList?.filter(s => s.isActive).map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {staffStats && selectedStaffId ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Regular Hours</p>
                  <p className="text-3xl font-bold mt-1">{Number((staffStats as any).regularHours || 0).toFixed(1)}h</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Overtime Hours</p>
                  <p className="text-3xl font-bold mt-1 text-destructive">{Number((staffStats as any).overtimeHours || 0).toFixed(1)}h</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Estimated Pay</p>
                  <p className="text-3xl font-bold mt-1">${Number((staffStats as any).totalPay || 0).toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
          ) : selectedStaffId ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Loading staff data…
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
                Select a staff member to view their details.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
