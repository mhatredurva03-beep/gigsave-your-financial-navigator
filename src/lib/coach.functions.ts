import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CoachReply {
  ok: boolean;
  answer: string;
}

const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * GigSave AI Coach. Reads only the authenticated user's own rows (RLS applies
 * through the request-scoped Supabase client) and asks Groq for a short answer.
 */
export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { question: string; history?: CoachMessage[] }) => ({
    question: String(input?.question ?? "").slice(0, 500),
    history: (input?.history ?? []).slice(-6),
  }))
  .handler(async ({ data, context }): Promise<CoachReply> => {
    if (!data.question.trim()) {
      return { ok: false, answer: "Ask me a question about your money and I'll take a look." };
    }

    const apiKey = process.env["GROQ_API_KEY"];
    if (!apiKey) {
      return {
        ok: false,
        answer: "AI Coach is temporarily unavailable. Please try again later.",
      };
    }

    const { buildSnapshot, money } = await import("./gigsave.server");
    const snapshot = await buildSnapshot(context.supabase, context.userId);

    if (!snapshot.hasData) {
      return {
        ok: true,
        answer:
          "There isn't enough data yet to answer that. Add some income and expenses in GigSave and I'll be able to give you real numbers.",
      };
    }

    const c = snapshot.currency;
    const facts = [
      `Currency: ${c}. Current month: ${snapshot.monthLabel}.`,
      `This month earned ${money(snapshot.monthEarned, c)}, spent ${money(snapshot.monthSpent, c)}.`,
      snapshot.monthlyBudget > 0
        ? `Monthly expense budget ${money(snapshot.monthlyBudget, c)}, used ${snapshot.budgetPercent}%.`
        : "No monthly expense budget is set.",
      `All-time: earned ${money(snapshot.totals.earned, c)}, spent ${money(snapshot.totals.spent, c)}, saved into jars ${money(snapshot.totals.saved, c)}, available to spend ${money(snapshot.totals.available, c)}.`,
      snapshot.categorySpend.length
        ? `Spending by category this month: ${snapshot.categorySpend.map((item) => `${item.category} ${money(item.amount, c)}`).join(", ")}.`
        : "No expenses logged this month.",
      snapshot.sourceIncome.length
        ? `Income by source this month: ${snapshot.sourceIncome.map((item) => `${item.source} ${money(item.amount, c)}`).join(", ")}.`
        : "No income logged this month.",
      snapshot.jars.length
        ? `Savings jars: ${snapshot.jars.map((jar) => `${jar.name} ${money(jar.balance, c)} (${jar.percentage}% of income)`).join(", ")}.`
        : "No savings jars set up.",
      snapshot.goals.length
        ? `Goals: ${snapshot.goals.map((goal) => `${goal.name} ${money(goal.current, c)}/${money(goal.target, c)} (${goal.percent}%${goal.completed ? ", completed" : ""})`).join(", ")}.`
        : "No goals set.",
      snapshot.recent.length
        ? `Recent activity: ${snapshot.recent.map((item) => `${item.date} ${item.kind} ${item.label} ${money(item.amount, c)}`).join("; ")}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const system = [
      "You are the GigSave AI Coach, helping gig workers (delivery riders, drivers, freelancers) manage money.",
      "Answer only from the DATA block below. Never invent transactions, budgets, jars, goals or numbers.",
      "If the data does not contain the answer, say there isn't enough data yet.",
      "Style: short (max 120 words), friendly, plain language, no jargon. Use simple bullets when listing. Always include the currency symbol with amounts.",
      "",
      "DATA:",
      facts,
    ].join("\n");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.3,
          max_tokens: 400,
          messages: [
            { role: "system", content: system },
            ...data.history.map((message) => ({ role: message.role, content: message.content })),
            { role: "user", content: data.question },
          ],
        }),
      });

      if (response.status === 429) {
        return {
          ok: false,
          answer: "The AI Coach is busy right now. Please try again in a minute.",
        };
      }
      if (!response.ok) {
        console.error("[coach] groq error", response.status, await response.text());
        return { ok: false, answer: "AI Coach is temporarily unavailable. Please try again later." };
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer = payload.choices?.[0]?.message?.content?.trim();
      if (!answer) {
        return { ok: false, answer: "I couldn't put an answer together. Please try again." };
      }
      return { ok: true, answer };
    } catch (error) {
      console.error("[coach] request failed", error);
      return { ok: false, answer: "AI Coach is temporarily unavailable. Please try again later." };
    }
  });
