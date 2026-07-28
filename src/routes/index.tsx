import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Mic, PiggyBank, ShieldCheck, Target, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GigSave — Smart Expense & Goal Tracker for Gig Workers" },
      {
        name: "description",
        content:
          "Track daily gig earnings, control expenses and auto-split every payout into savings jars that fund your goals.",
      },
      { property: "og:title", content: "GigSave — Save automatically from every gig payout" },
      {
        property: "og:description",
        content: "Built for delivery riders, drivers and freelancers with irregular income.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Wallet,
    title: "Log earnings in seconds",
    body: "Record every payout from Swiggy, Zomato, Uber, Ola or private clients in one tap.",
  },
  {
    icon: PiggyBank,
    title: "Automatic savings jars",
    body: "Set a percentage per jar and GigSave splits every rupee you earn the moment it lands.",
  },
  {
    icon: Target,
    title: "Goals that finish themselves",
    body: "Link jars to goals like a new bike or emergency fund and watch the countdown shrink.",
  },
  {
    icon: BarChart3,
    title: "Know your real numbers",
    body: "Weekly trends, category breakdowns and a financial health score out of 100.",
  },
  {
    icon: Mic,
    title: "Voice entry",
    body: 'Just say "earned 1200 from Zomato today" and the form fills itself.',
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your data is locked to your account with row-level security. Nobody else can read it.",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecked(true);
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-glow">
            <PiggyBank className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
        </div>
        <Button asChild variant="hero" size="sm">
          <Link to="/auth">Get started</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="py-12 text-center sm:py-20">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            For riders, drivers &amp; freelancers
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Turn irregular gig income into{" "}
            <span className="text-gradient-primary">steady savings</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">{APP_TAGLINE}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="hero" size="pill" disabled={!checked}>
              <Link to="/auth">
                Start saving free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <GlassCard key={title}>
              <span className="grid h-11 w-11 place-items-center rounded-xl gradient-primary text-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </GlassCard>
          ))}
        </section>

        <section className="mt-16 rounded-3xl gradient-primary px-6 py-12 text-center text-white shadow-glow">
          <h2 className="text-2xl font-bold sm:text-3xl">Your next payout can start a savings habit</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm opacity-90">
            Set up your jars once. GigSave handles the discipline from there.
          </p>
          <Button asChild size="pill" className="mt-7 bg-white text-foreground hover:bg-white/90">
            <Link to="/auth">Create your free account</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. Built for gig workers.
      </footer>
    </div>
  );
}
