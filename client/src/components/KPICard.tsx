import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: LucideIcon;
    subtitle?: string;
}

export function KPICard({ title, value, change, changeType = "neutral", icon: Icon, subtitle }: KPICardProps) {
    return (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    {change && (
                        <p className={cn(
                            "text-xs font-medium",
                            changeType === "positive" && "text-success",
                            changeType === "negative" && "text-destructive",
                            changeType === "neutral" && "text-muted-foreground"
                        )}>
                            {change}
                        </p>
                    )}
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
                <div className="p-2.5 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
            </div>
        </div>
    );
}
