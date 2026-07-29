import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminService } from "@/services/adminService";
import { APP_NAME } from "@/constants/app";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw new Error(error.message);

      // Check if user is admin
      const isAdmin = await adminService.checkIsAdmin();
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast.error("Access denied. You are not an administrator.");
        return;
      }

      navigate({ to: "/admin/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
            {APP_NAME} Admin
          </h1>
          <p className="mt-1 text-sm text-gray-500">Super Admin Panel Access</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="admin@gigsave.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
              disabled={pending}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in as Admin"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            Only authorized administrators can access this panel.
          </p>
        </div>
      </div>
    </div>
  );
}