import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AlertResult {
  created: { type: string; title: string }[];
  emailed: number;
}

const LOW_BUDGET_THRESHOLD = 0.8;

/**
 * Checks the signed-in user's budget usage and jar/goal completion, then raises
 * in-app notifications + one-time emails. `notification_events` guarantees each
 * event is only ever announced once per user, budget period or jar.
 */
export const runFinancialAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlertResult> => {
    const { supabase, userId } = context;
    const helpers = await import("./gigsave.server");
    const snapshot = await helpers.buildSnapshot(supabase, userId);
    const period = helpers.monthPeriod();

    const { data: profile } = await supabase
      .from("profiles")
      .select("email_budget_alerts, email_jar_alerts, notifications_enabled")
      .eq("id", userId)
      .maybeSingle();

    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email ?? null;
    const currency = snapshot.currency;

    const created: { type: string; title: string }[] = [];
    let emailed = 0;

    /** Claims an event; returns false when it was already announced. */
    async function claim(eventType: string, subjectId: string, eventPeriod: string) {
      const { error } = await supabase
        .from("notification_events")
        .insert({
          user_id: userId,
          event_type: eventType,
          subject_id: subjectId,
          period: eventPeriod,
        });
      return !error;
    }

    async function announce(input: {
      eventType: string;
      subjectId: string;
      period: string;
      title: string;
      message: string;
      type: "warning" | "danger" | "success";
      emailAllowed: boolean;
      email?: { subject: string; html: string };
    }) {
      const claimed = await claim(input.eventType, input.subjectId, input.period);
      if (!claimed) return;

      if (profile?.notifications_enabled !== false) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: input.title,
          message: input.message,
          type: input.type,
        });
      }
      created.push({ type: input.eventType, title: input.title });

      if (input.emailAllowed && email && input.email) {
        const sent = await helpers.sendAlertEmail(email, input.email.subject, input.email.html);
        if (sent) {
          emailed += 1;
          await supabase
            .from("notification_events")
            .update({ email_sent: true })
            .eq("user_id", userId)
            .eq("event_type", input.eventType)
            .eq("subject_id", input.subjectId)
            .eq("period", input.period);
        }
      }
    }

    // ---- Budget alerts (monthly expense budget) ----
    const limit = snapshot.monthlyBudget;
    if (limit > 0) {
      const spent = snapshot.monthSpent;
      const budgetName = "Monthly expenses";
      const emailAllowed = profile?.email_budget_alerts !== false;

      if (spent >= limit) {
        await announce({
          eventType: "budget_overspent",
          subjectId: "monthly_expense_budget",
          period,
          title: "Budget exceeded",
          message: `You've spent ${helpers.money(spent, currency)} of your ${helpers.money(limit, currency)} monthly budget (${snapshot.budgetPercent}%).`,
          type: "danger",
          emailAllowed,
          email: helpers.budgetOverEmail({ name: budgetName, limit, spent, currency }),
        });
      } else if (spent >= limit * LOW_BUDGET_THRESHOLD) {
        await announce({
          eventType: "budget_low",
          subjectId: "monthly_expense_budget",
          period,
          title: "Budget running low",
          message: `Your monthly budget is ${snapshot.budgetPercent}% used — ${helpers.money(limit - spent, currency)} left.`,
          type: "warning",
          emailAllowed,
          email: helpers.budgetLowEmail({ name: budgetName, limit, spent, currency }),
        });
      }
    }

    // ---- Jar / goal completion alerts ----
    const emailJarAllowed = profile?.email_jar_alerts !== false;
    for (const goal of snapshot.goals) {
      if (goal.target <= 0 || goal.current < goal.target) continue;
      await announce({
        eventType: "jar_full",
        subjectId: goal.id,
        period: "",
        title: `${goal.name} is fully funded`,
        message: `You saved ${helpers.money(goal.current, currency)} of your ${helpers.money(goal.target, currency)} target. Goal completed!`,
        type: "success",
        emailAllowed: emailJarAllowed,
        email: helpers.jarFullEmail({
          name: goal.name,
          current: goal.current,
          target: goal.target,
          currency,
        }),
      });
    }

    return { created, emailed };
  });
