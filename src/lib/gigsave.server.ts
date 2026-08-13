/**
 * Server-only helpers shared by the AI Coach and the email alert engine.
 * Never imported from client code (blocked by the `.server` filename rule).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

const num = (value: unknown) => (value == null ? 0 : Number(value) || 0);

export interface FinancialSnapshot {
  currency: string;
  monthLabel: string;
  monthlyBudget: number;
  monthSpent: number;
  monthEarned: number;
  budgetPercent: number;
  totals: { earned: number; spent: number; saved: number; available: number };
  categorySpend: { category: string; amount: number }[];
  sourceIncome: { source: string; amount: number }[];
  jars: { name: string; balance: number; percentage: number }[];
  goals: {
    name: string;
    current: number;
    target: number;
    percent: number;
    completed: boolean;
    jarId: string | null;
    id: string;
  }[];
  recent: { kind: "income" | "expense"; label: string; amount: number; date: string }[];
  hasData: boolean;
}

export function monthPeriod(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export async function buildSnapshot(supabase: DB, userId: string): Promise<FinancialSnapshot> {
  const period = monthPeriod();
  const monthStart = `${period}-01`;

  const [profileRes, incomeRes, expenseRes, jarRes, goalRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("income")
      .select("amount, source, income_date, allocated_amount")
      .eq("user_id", userId)
      .order("income_date", { ascending: false })
      .limit(400),
    supabase
      .from("expenses")
      .select("amount, category, expense_date, note")
      .eq("user_id", userId)
      .order("expense_date", { ascending: false })
      .limit(400),
    supabase.from("jars").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const income = incomeRes.data ?? [];
  const expenses = expenseRes.data ?? [];
  const jars = jarRes.data ?? [];
  const goals = goalRes.data ?? [];

  const monthExpenses = expenses.filter((row) => row.expense_date >= monthStart);
  const monthIncome = income.filter((row) => row.income_date >= monthStart);

  const monthSpent = monthExpenses.reduce((sum, row) => sum + num(row.amount), 0);
  const monthEarned = monthIncome.reduce((sum, row) => sum + num(row.amount), 0);
  const monthlyBudget = num(profile?.monthly_expense_budget);

  const totalEarned = income.reduce((sum, row) => sum + num(row.amount), 0);
  const totalSpent = expenses.reduce((sum, row) => sum + num(row.amount), 0);
  const totalSaved = income.reduce((sum, row) => sum + num(row.allocated_amount), 0);

  const byCategory = new Map<string, number>();
  monthExpenses.forEach((row) =>
    byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + num(row.amount)),
  );
  const bySource = new Map<string, number>();
  monthIncome.forEach((row) =>
    bySource.set(row.source, (bySource.get(row.source) ?? 0) + num(row.amount)),
  );

  const recent = [
    ...income.slice(0, 10).map((row) => ({
      kind: "income" as const,
      label: row.source,
      amount: num(row.amount),
      date: row.income_date,
    })),
    ...expenses.slice(0, 10).map((row) => ({
      kind: "expense" as const,
      label: row.category,
      amount: num(row.amount),
      date: row.expense_date,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);

  return {
    currency: profile?.preferred_currency ?? "INR",
    monthLabel: period,
    monthlyBudget,
    monthSpent,
    monthEarned,
    budgetPercent: monthlyBudget > 0 ? Math.round((monthSpent / monthlyBudget) * 100) : 0,
    totals: {
      earned: totalEarned,
      spent: totalSpent,
      saved: totalSaved,
      available: totalEarned - totalSaved - totalSpent,
    },
    categorySpend: [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    sourceIncome: [...bySource.entries()]
      .map(([source, amount]) => ({ source, amount }))
      .sort((a, b) => b.amount - a.amount),
    jars: jars.map((jar) => ({
      name: jar.jar_name,
      balance: num(jar.balance),
      percentage: num(jar.percentage),
    })),
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.goal_name,
      current: num(goal.current_amount),
      target: num(goal.target_amount),
      percent: num(goal.target_amount) > 0 ? Math.round((num(goal.current_amount) / num(goal.target_amount)) * 100) : 0,
      completed: Boolean(goal.is_completed),
      jarId: goal.jar_id,
    })),
    recent,
    hasData: income.length > 0 || expenses.length > 0,
  };
}

/* ------------------------------- email ------------------------------- */

const CURRENCY_SYMBOL: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

export function money(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  return `${symbol}${Math.round(amount).toLocaleString("en-IN")}`;
}

const NAVY = "#173B57";

function shell(title: string, accent: string, bodyRows: string[], message: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f9fc;font-family:Arial,Helvetica,sans-serif;color:#0f2233">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:${NAVY};color:#fff;border-radius:16px 16px 0 0;padding:18px 22px;font-size:16px;font-weight:bold">GigSave</div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:22px">
      <h1 style="margin:0 0 8px;font-size:19px;color:${accent}">${title}</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5">${message}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${bodyRows.join("")}</table>
    </div>
    <p style="margin:14px 0 0;font-size:11px;color:#5c7288;text-align:center">You can turn these alerts off in GigSave &rarr; Settings.</p>
  </div></body></html>`;
}

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 0;color:#5c7288">${label}</td><td style="padding:6px 0;text-align:right;font-weight:bold">${value}</td></tr>`;

export function budgetLowEmail(input: {
  name: string;
  limit: number;
  spent: number;
  currency: string;
}) {
  const remaining = Math.max(0, input.limit - input.spent);
  const percent = Math.round((input.spent / input.limit) * 100);
  return {
    subject: `Your ${input.name} budget is ${percent}% used`,
    html: shell(
      `${input.name} budget is ${percent}% used`,
      "#B07C10",
      [
        row("Budget limit", money(input.limit, input.currency)),
        row("Spent so far", money(input.spent, input.currency)),
        row("Remaining", money(remaining, input.currency)),
        row("Used", `${percent}%`),
      ],
      `You have ${money(remaining, input.currency)} left from your ${money(input.limit, input.currency)} budget. Slowing down on non-essentials now keeps you in the green.`,
    ),
  };
}

export function budgetOverEmail(input: {
  name: string;
  limit: number;
  spent: number;
  currency: string;
}) {
  const over = Math.max(0, input.spent - input.limit);
  const percent = Math.round((input.spent / input.limit) * 100);
  return {
    subject: `Your ${input.name} budget has been exceeded`,
    html: shell(
      `${input.name} budget exceeded`,
      "#C24444",
      [
        row("Budget limit", money(input.limit, input.currency)),
        row("Spent", money(input.spent, input.currency)),
        row("Over by", money(over, input.currency)),
        row("Used", `${percent}%`),
      ],
      `You have spent ${money(input.spent, input.currency)} against your ${money(input.limit, input.currency)} budget. Try pausing extra spends for a few days to recover.`,
    ),
  };
}

export function jarFullEmail(input: {
  name: string;
  current: number;
  target: number;
  currency: string;
}) {
  return {
    subject: `Your ${input.name} jar reached its target 🎉`,
    html: shell(
      `${input.name} is fully funded`,
      "#178A4C",
      [
        row("Saved", money(input.current, input.currency)),
        row("Target", money(input.target, input.currency)),
        row("Status", "Completed"),
      ],
      `Great work — your ${input.name} jar has reached its savings target. Keep the same rhythm and set your next goal.`,
    ),
  };
}

/** Sends one transactional email through Resend. Returns false when unavailable. */
export async function sendAlertEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn("[alerts] RESEND_API_KEY is not configured; skipping email");
    return false;
  }
  const from = process.env["ALERT_EMAIL_FROM"] || "GigSave <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      console.error("[alerts] email provider error", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[alerts] email send failed", error);
    return false;
  }
}
