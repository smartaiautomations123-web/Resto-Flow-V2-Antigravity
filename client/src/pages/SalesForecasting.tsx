import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { format, addDays, parseISO } from "date-fns";
import {
    Calendar as CalendarIcon,
    CloudRain,
    Sun,
    Zap,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CloudSun,
    Users,
    ChefHat
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    ComposedChart
} from "recharts";

export default function SalesForecasting() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = addDays(new Date(), 7).toISOString().split('T')[0];

    const { data: forecasts = [], isLoading: loadingForecasts } = trpc.forecasting.getForecasts.useQuery({
        startDate: today,
        endDate: nextWeek
    });

    const { data: stockAlerts = [], isLoading: loadingAlerts } = trpc.forecasting.getStockAlerts.useQuery();

    const generateForecast = trpc.forecasting.generateForecast.useMutation();
    const analyzeStock = trpc.forecasting.analyzeStock.useMutation();

    if (loadingForecasts || loadingAlerts) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <Skeleton className="h-10 w-1/3 mb-4" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    const todayForecast = forecasts[0] || null;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">AI Sales & Labour Forecast</h2>
                    <p className="text-muted-foreground">
                        Predictive insights driven by historical data, weather patterns, and local events.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => analyzeStock.mutate()}
                        disabled={analyzeStock.isPending}
                    >
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                        Run Stock Analysis
                    </Button>
                    <Button
                        onClick={() => generateForecast.mutate()}
                        disabled={generateForecast.isPending}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Zap className="mr-2 h-4 w-4" />
                        Generate AI Forecast
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Forecast Overview</TabsTrigger>
                    <TabsTrigger value="stock">Smart Stock Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Projected Revenue (Today)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${Number(todayForecast?.forecastedRevenue || 0).toFixed(2)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-success inline-flex items-center">
                                        <TrendingUp className="mr-1 h-3 w-3" /> +12%
                                    </span>{" "}
                                    from historical average
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Req. Labour Hours</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {Number(todayForecast?.projectedLabourHours || 0).toFixed(1)} hrs
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Est. Labour Cost: ${Number(todayForecast?.projectedLabourCost || 0).toFixed(2)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Projected Orders</CardTitle>
                                <ChefHat className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{todayForecast?.forecastedOrders || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    High confidence score: {todayForecast?.confidence || 0}%
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Weather & Event Impact</CardTitle>
                                <CloudSun className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-1">
                                    {Number(todayForecast?.weatherImpactScore) < 0 ? (
                                        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                                            <CloudRain className="mr-1 h-3 w-3" /> {todayForecast?.weatherImpactScore}%
                                        </Badge>
                                    ) : (
                                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                            <Sun className="mr-1 h-3 w-3" /> +{todayForecast?.weatherImpactScore || 0}%
                                        </Badge>
                                    )}
                                    <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
                                        <CalendarIcon className="mr-1 h-3 w-3" /> +{todayForecast?.eventImpactScore || 0}%
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Impact multipliers applied to baseline
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>7-Day Sales & Labour Forecast</CardTitle>
                            <CardDescription>
                                Projected revenue and required labour costs based on AI analysis.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={forecasts}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="dayOfWeek" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="forecastedRevenue" name="Forecasted Revenue ($)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="projectedLabourCost" name="Labour Cost ($)" stroke="#82ca9d" strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stock" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Stock Alerts & Seasonality</CardTitle>
                            <CardDescription>
                                Smart recommendations to decrease food waste and optimize stock levels based on predictive trends.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ingredient</TableHead>
                                        <TableHead>Alert Type</TableHead>
                                        <TableHead>Recommendation</TableHead>
                                        <TableHead className="text-right">Seasonality Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockAlerts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                No active stock alerts. Run the analysis engine to detect insights.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stockAlerts.map((alert: any) => (
                                            <TableRow key={alert.id}>
                                                <TableCell className="font-medium">
                                                    Ingredient #{alert.ingredientId}
                                                </TableCell>
                                                <TableCell>
                                                    {alert.alertType === 'slow_moving' && <Badge variant="destructive">Slow Moving</Badge>}
                                                    {alert.alertType === 'high_waste_risk' && <Badge className="bg-orange-500 hover:bg-orange-600">High Waste Risk</Badge>}
                                                    {alert.alertType === 'seasonal_upward' && <Badge variant="default" className="bg-green-600">Upward Trend</Badge>}
                                                    {alert.alertType === 'seasonal_downward' && <Badge variant="secondary">Downward Trend</Badge>}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {alert.recommendation}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {Number(alert.seasonalityScore).toFixed(1)}x
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
