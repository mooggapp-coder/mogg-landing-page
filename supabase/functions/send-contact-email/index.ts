import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFY_EMAIL = Deno.env.get("CONTACT_NOTIFY_EMAIL") ?? "mooggapp@gmail.com";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "MOGG Contact <onboarding@resend.dev>";

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    return jsonResponse({ error: "Email service is not configured" }, 500);
  }

  let payload: ContactPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const subject = payload.subject?.trim() ?? "";
  const message = payload.message?.trim() ?? "";

  if (!name || !email || !subject || !message) {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [NOTIFY_EMAIL],
      reply_to: email,
      subject: `New Contact Form: ${subject}`,
      text: [
        "New contact form submission from mogg.life",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    }),
  });

  if (!emailResponse.ok) {
    const errorBody = await emailResponse.text();
    console.error("Resend API error:", emailResponse.status, errorBody);
    return jsonResponse({ error: "Failed to send email notification" }, 502);
  }

  const result = await emailResponse.json();
  return jsonResponse({ success: true, id: result.id });
});
