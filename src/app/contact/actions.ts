"use server";

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export async function sendContactMessageAction(
  payload: ContactPayload
): Promise<{ error?: string; success?: boolean }> {
  const { name, email, message } = payload;
  if (!name.trim() || !email.trim() || !message.trim()) {
    return { error: "All fields are required." };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const toEmail = process.env.INTEREST_NOTIFY_EMAIL?.trim() || "sudnas11@gmail.com";
  const fromEmail = process.env.INTEREST_FROM_EMAIL?.trim() || "SideFlip <onboarding@resend.dev>";

  if (!apiKey) {
    // Dev mode: just log
    console.info("[contact] message received", { name, email, message });
    return { success: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `[SideFlip Contact] ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });

  if (!res.ok) return { error: "Could not send message right now." };
  return { success: true };
}
