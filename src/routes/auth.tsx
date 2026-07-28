import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PiggyBank, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService } from "@/services/authService";
import { lovable } from "@/integrations/lovable";
import { APP_NAME, APP_TAGLINE, OCCUPATIONS } from "@/constants/app";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to GigSave — Track Earnings & Savings" },
      {
        name: "description",
        content: "Sign in or create your free GigSave account to track gig earnings, expenses and savings goals.",
      },
      { property: "og:title", content: "Sign in to GigSave" },
      { property: "og:description", content: "Create your free GigSave account and start saving automatically." },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ fullName: "", email: "", password: "", occupation: OCCUPATIONS[0] });

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signInSchema.safeParse(signIn);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setPending("signin");
    try {
      await authService.signIn(parsed.data.email, parsed.data.password);
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in");
    } finally {
      setPending(null);
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(signUp);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setPending("signup");
    try {
      const result = await authService.signUp(
        parsed.data.email,
        parsed.data.password,
        parsed.data.fullName,
        signUp.occupation,
      );
      if (result.session) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        toast.success("Check your inbox to confirm your email, then sign in.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your account");
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    setPending("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function handleForgotPassword() {
    const email = signIn.email.trim();
    if (!z.string().email().safeParse(email).success) {
      return toast.error("Enter your email above first, then tap reset.");
    }
    try {
      await authService.sendPasswordReset(email);
      toast.success("Password reset link sent to your email.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset link");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <Link to="/" className="inline-grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-white shadow-glow">
            <PiggyBank className="h-7 w-7" aria-hidden="true" />
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form className="space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    value={signIn.email}
                    onChange={(e) => setSignIn((s) => ({ ...s, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    value={signIn.password}
                    onChange={(e) => setSignIn((s) => ({ ...s, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
                <Button type="submit" variant="hero" className="w-full" disabled={pending !== null}>
                  {pending === "signin" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form className="space-y-4" onSubmit={handleSignUp}>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    value={signUp.fullName}
                    onChange={(e) => setSignUp((s) => ({ ...s, fullName: e.target.value }))}
                    placeholder="Ravi Kumar"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-occupation">What do you do?</Label>
                  <Select
                    value={signUp.occupation}
                    onValueChange={(value) => setSignUp((s) => ({ ...s, occupation: value }))}
                  >
                    <SelectTrigger id="signup-occupation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPATIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    value={signUp.email}
                    onChange={(e) => setSignUp((s) => ({ ...s, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    value={signUp.password}
                    onChange={(e) => setSignUp((s) => ({ ...s, password: e.target.value }))}
                    placeholder="At least 8 characters"
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={pending !== null}>
                  {pending === "signup" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create free account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={pending !== null}>
            {pending === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
          </Button>
        </div>
      </div>
    </div>
  );
}
