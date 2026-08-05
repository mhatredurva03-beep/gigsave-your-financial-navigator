import { supabase, unwrap, requireUserId } from "./client";
import type { Profile, ProfileUpdate } from "./types";

export const authService = {
  async signUp(email: string, password: string, fullName: string, occupation?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, occupation: occupation ?? null },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw new Error(error.message);
  },
};

export const profileService = {
  async get(): Promise<Profile | null> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(`Could not load profile: ${error.message}`);
    return data;
  },

  async update(patch: ProfileUpdate): Promise<Profile> {
    const userId = await requireUserId();
    return unwrap(
      await supabase.from("profiles").update(patch).eq("id", userId).select("*").single(),
      "Could not save profile",
    );
  },
};
