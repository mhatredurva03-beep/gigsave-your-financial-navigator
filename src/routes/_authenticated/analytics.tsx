import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressRing } from "@/components/ui/progress-ring";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { addDays, formatCompact, formatCurrency, localISODate, toNumber } from "@/utils/format";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — GigSave" },
      { name: "description", content: "See earnings trends, spending breakdowns and your financial health score." },
      { property: "og:title", content: "Analytics — GigSave" },
      { property: "og:description", content: "Charts and trends for gig income, expenses and savings." },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_TONES = [
  "var(--brand-violet)",
  "var(--brand-pink)",
  "var(--brand-sky)",
  "var(--brand-amber)",
  "var(--brand-teal)",
  "var(--brand-purple)",
];

function AnalyticsPage() {
  const { income, expenses, jars, currency, health, totalEarned, totalSpent, totalSaved, isLoading } =
    useFinancialOverview();

  const daily = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => localISODate(addDays(new Date(), -(13 - index))));
    return days.map((day) => ({
      day: day.slice(5),
      earned: income.filter((r) => r.income_date === day).reduce((s, r) => s + toNumber(r.amount), 0),
      saved: income.filter((r) => r.income_date === day).reduce((s, r) => s + toNumber(r.allocated_amount), 0),
      spent: expenses.filter((r) => r.expense_date === day).reduce((s, r) => s + toNumber(r.amount), 0),
    }));
  }, [income, expenses]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((row) => map.set(row.category, (map.get(row.category) ?? 0) + toNumber(row.amount)));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    income.forEach((row) => map.set(row.source, (map.get(row.source) ?? 0) + toNumber(row.amount)));
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [income]);

  const hasData = income.length > 0 || expenses.length > 0;

  const tooltipFormatter = (value: number | string) => formatCurrency(Number(value), currency);
  const axisFormatter = (value: number) => formatCompact(value, currency);

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading title="Analytics" description="Where your money comes from and where it goes." />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Crunching your numbers…</p>
        ) : !hasData ? (
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="Nothing to chart yet"
            description="Record some income and expenses and your trends will appear here."
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <GlassCard>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total earned</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalEarned, currency)}</p>
              </GlassCard>
              <GlassCard>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total saved</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalSaved, currency)}</p>
              </GlassCard>
              <GlassCard>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total spent</p>
                <p className="mt-1 text-2xl font-semibold">{formatCurrency(totalSpent, currency)}</p>
              </GlassCard>
            </div>

            <GlassCard className="space-y-4">
              <SectionHeading title="Last 14 days" description="Earnings versus spending." />
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={daily} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earnedFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-violet)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--brand-violet)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="spentFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand-pink)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--brand-pink)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                    <YAxis
                      tickFormatter={axisFormatter}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                      fontSize={11}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip
                      formatter={tooltipFormatter}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        color: "var(--foreground)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="earned"
                      name="Earned"
                      stroke="var(--brand-violet)"
                      fill="url(#earnedFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      name="Spent"
                      stroke="var(--brand-pink)"
                      fill="url(#spentFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <GlassCard className="space-y-4">
                <SectionHeading title="Spending by category" />
                {byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                          {byCategory.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_TONES[index % PIE_TONES.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={tooltipFormatter}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            color: "var(--foreground)",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>

              <GlassCard className="space-y-4">
                <SectionHeading title="Top income sources" />
                {bySource.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No income recorded yet.</p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bySource} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                        <YAxis
                          tickFormatter={axisFormatter}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                          fontSize={11}
                          stroke="var(--muted-foreground)"
                        />
                        <Tooltip
                          cursor={{ fill: "var(--muted)" }}
                          formatter={tooltipFormatter}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            color: "var(--foreground)",
                          }}
                        />
                        <Bar dataKey="value" name="Earned" radius={[8, 8, 0, 0]} fill="var(--brand-violet)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </GlassCard>
            </div>

            <GlassCard className="space-y-4">
              <SectionHeading title="Financial health" description={`${health.label} — ${health.score}/100`} />
              <div className="flex flex-wrap items-center gap-6">
                <ProgressRing value={health.score} size={110} thickness={10}>
                  <span className="text-2xl font-semibold">{health.score}</span>
                  <span className="text-[11px] text-muted-foreground">{health.label}</span>
                </ProgressRing>
                <div className="min-w-[220px] flex-1 space-y-3">
                  {[
                    { label: "Savings rate", value: health.savingsScore },
                    { label: "Goal progress", value: health.goalScore },
                    { label: "Expense control", value: health.expenseScore },
                    { label: "Consistency", value: health.consistencyScore },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}/25</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-700"
                          style={{ width: `${(item.value / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {jars.length > 0 ? (
              <GlassCard className="space-y-3">
                <SectionHeading title="Jar balances" />
                {jars.map((jar) => (
                  <div key={jar.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{jar.jar_name}</span>
                    <span className="font-semibold">{formatCurrency(toNumber(jar.balance), currency)}</span>
                  </div>
                ))}
              </GlassCard>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
