import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/layout/AppShell";
import { VoiceCapture } from "@/components/entry/VoiceCapture";
import { GlassCard, SectionHeading } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useAddExpense, useDeleteExpense, useExpenses, useProfile } from "@/hooks/useGigSaveData";
import { EXPENSE_CATEGORIES } from "@/constants/app";
import { formatCurrency, localISODate, relativeDay, toNumber } from "@/utils/format";
import { toneStyle } from "@/utils/tone";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount above zero").max(10_000_000),
  category: z.string().trim().min(1, "Pick a category").max(40),
  expense_date: z.string().min(1, "Pick a date"),
  note: z.string().trim().max(280).optional(),
});

function ExpensesPage() {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: profile } = useProfile();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const currency = profile?.preferred_currency ?? "INR";

  const [form, setForm] = useState({
    amount: "",
    category: EXPENSE_CATEGORIES[0].name as string,
    expense_date: localISODate(),
    note: "",
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    addExpense.mutate(
      {
        amount: parsed.data.amount,
        category: parsed.data.category,
        expense_date: parsed.data.expense_date,
        note: parsed.data.note || null,
      },
      { onSuccess: () => setForm((current) => ({ ...current, amount: "", note: "" })) },
    );
  }

  function iconFor(category: string) {
    return EXPENSE_CATEGORIES.find((item) => item.name === category) ?? EXPENSE_CATEGORIES[0];
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <SectionHeading title="Expenses" description="Know exactly where your earnings go." />

        <GlassCard>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="expense-amount">Amount</Label>
                <Input
                  id="expense-amount"
                  inputMode="decimal"
                  placeholder="250"
                  value={form.amount}
                  onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-category">Category</Label>
                <Select value={form.category} onValueChange={(value) => setForm((s) => ({ ...s, category: value }))}>
                  <SelectTrigger id="expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  max={localISODate()}
                  value={form.expense_date}
                  onChange={(e) => setForm((s) => ({ ...s, expense_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense-note">Note (optional)</Label>
                <Textarea
                  id="expense-note"
                  rows={1}
                  placeholder="Petrol top-up"
                  value={form.note}
                  onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="hero" disabled={addExpense.isPending}>
                {addExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add expense
              </Button>
              <VoiceCapture
                onParsed={(entry) =>
                  setForm((current) => ({
                    ...current,
                    amount: entry.amount ? String(entry.amount) : current.amount,
                    category: entry.category,
                    expense_date: entry.date,
                  }))
                }
              />
            </div>
          </form>
        </GlassCard>

        <section className="space-y-3">
          <SectionHeading title="History" />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your expenses…</p>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="No expenses yet"
              description="Track fuel, food and repairs to see your real take-home."
            />
          ) : (
            <GlassCard className="divide-y divide-border/60 p-0">
              {expenses.map((row) => {
                const meta = iconFor(row.category);
                return (
                  <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                      style={toneStyle(meta.tone)}
                    >
                      <DynamicIcon name={meta.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {relativeDay(row.expense_date)}
                        {row.note ? ` · ${row.note}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      −{formatCurrency(toNumber(row.amount), currency)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${row.category} expense`}
                      onClick={() => deleteExpense.mutate(row.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
            </GlassCard>
          )}
        </section>
      </div>
    </AppShell>
  );
}
