"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      user_id: data.user.id,
      company_name: "",
      whatsapp_phone: "",
      currency: "FCFA",
    });
  }

  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email") || "").trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl.replace(/\/$/, "")}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/login?mode=reset&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?mode=reset&message=Email%20de%20reinitialisation%20envoye");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createQuote(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("pdf");
  const prospectName = String(formData.get("prospect_name") || "").trim();
  const prospectPhone = String(formData.get("prospect_phone") || "").trim();
  const amount = Number(formData.get("amount") || 0);

  if (!(file instanceof File) || file.size === 0) {
    redirect("/?error=PDF%20manquant");
  }

  if (file.type !== "application/pdf") {
    redirect("/?error=Le%20fichier%20doit%20etre%20un%20PDF");
  }

  const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from("quotes-pdf")
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    redirect(`/?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error: insertError } = await supabase.from("quotes").insert({
    user_id: user.id,
    prospect_name: prospectName,
    prospect_phone: prospectPhone,
    amount,
    pdf_path: path,
  });

  if (insertError) {
    redirect(`/?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateQuote(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") || "");
  const prospectName = String(formData.get("prospect_name") || "").trim();
  const prospectPhone = String(formData.get("prospect_phone") || "").trim();
  const amount = Number(formData.get("amount") || 0);

  const { error } = await supabase
    .from("quotes")
    .update({
      prospect_name: prospectName,
      prospect_phone: prospectPhone,
      amount,
    })
    .eq("id", id)
    .eq("user_id", user!.id);

  if (error) {
    redirect(`/quotes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/quotes");
  redirect("/quotes");
}

export async function deleteQuote(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") || "");
  const pdfPath = String(formData.get("pdf_path") || "");

  await supabase.storage.from("quotes-pdf").remove([pdfPath]);

  const { error } = await supabase.from("quotes").delete().eq("id", id).eq("user_id", user!.id);

  if (error) {
    redirect(`/quotes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/quotes");
  redirect("/quotes");
}

export async function markReminderSent(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") || "");
  const { data: quote } = await supabase
    .from("quotes")
    .select("reminder_count")
    .eq("id", id)
    .eq("user_id", user!.id)
    .maybeSingle();

  const reminderCount =
    typeof quote?.reminder_count === "number" ? quote.reminder_count + 1 : 1;

  const { error } = await supabase
    .from("quotes")
    .update({
      reminder_sent_at: new Date().toISOString(),
      reminder_count: reminderCount,
    })
    .eq("id", id)
    .eq("user_id", user!.id);

  if (error) {
    redirect(`/quotes?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/quotes");
  redirect("/quotes?filter=due");
}

export async function saveSettings(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    company_name: String(formData.get("company_name") || "").trim(),
    whatsapp_phone: String(formData.get("whatsapp_phone") || "").trim(),
    currency: String(formData.get("currency") || "FCFA").trim(),
    reminder_delay_hours: Number(formData.get("reminder_delay_hours") || 48),
    reminder_template: String(formData.get("reminder_template") || "").trim(),
  });

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings");
}
