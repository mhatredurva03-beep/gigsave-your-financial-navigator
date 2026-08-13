import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askCoach, type CoachMessage } from "@/lib/coach.functions";
import { cn } from "@/lib/utils";

export const SUGGESTED_QUESTIONS = [
  "Where am I spending the most?",
  "How can I save more this month?",
  "How are my budgets doing?",
  "Give me a summary of this month.",
  "How close am I to my goals?",
];

export function CoachChat({ className }: { className?: string }) {
  const ask = useServerFn(askCoach);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setValue("");
    const history = messages.slice(-6);
    setMessages((current) => [...current, { role: "user", content: text }]);
    setPending(true);
    try {
      const reply = await ask({ data: { question: text, history } });
      setMessages((current) => [...current, { role: "assistant", content: reply.answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "AI Coach is temporarily unavailable. Please try again later.",
        },
      ]);
    } finally {
      setPending(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-4", className)}>
      <div
        className="min-h-56 flex-1 space-y-3 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="AI Coach conversation"
      >
        {messages.length === 0 ? (
          <div className="rounded-2xl bg-primary-soft/70 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ask me anything about your money
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              I read your own income, expenses, budget, jars and goals — nothing else.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[90%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {message.content}
            </div>
          ))
        )}
        {pending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Thinking…
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => send(question)}
            disabled={pending}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send(value);
        }}
      >
        <label className="sr-only" htmlFor="coach-input">
          Ask the AI Coach
        </label>
        <Input
          id="coach-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="How much did I spend this month?"
          autoComplete="off"
        />
        <Button type="submit" disabled={pending || !value.trim()} aria-label="Send question">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
