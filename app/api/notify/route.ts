import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.NOTIFY_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://haig-app.vercel.app";

export async function POST(req: NextRequest) {
  // Verify caller is authenticated
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type } = body as { type: "dm" | "announcement" };

  const admin = createAdminClient();

  // ── DM notification ───────────────────────────────────────────────────────
  if (type === "dm") {
    const { recipientId, senderName, preview } = body as {
      recipientId: string;
      senderName: string;
      preview: string;
    };

    // Only notify on the first unread message — skip if they already have unread DMs from this sender
    const { count } = await admin
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .eq("recipient_id", recipientId)
      .eq("read", false);

    // count > 1 means this isn't the first unread, skip
    if ((count ?? 0) > 1) return NextResponse.json({ ok: true });

    // Get recipient's email from auth
    const { data: userData } = await admin.auth.admin.getUserById(recipientId);
    const recipientEmail = userData?.user?.email;
    if (!recipientEmail) return NextResponse.json({ ok: true });

    // Get recipient's name
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", recipientId)
      .single();

    await resend.emails.send({
      from: `HAIG <${FROM}>`,
      to:   recipientEmail,
      subject: `New message from ${senderName}`,
      html: emailTemplate({
        title: `New message from ${senderName}`,
        greeting: `Hey ${profile?.full_name ?? "there"},`,
        body: `<strong>${senderName}</strong> sent you a message:`,
        quote: preview,
        ctaLabel: "Open Messages",
        ctaUrl: `${APP_URL}/messages`,
      }),
    });

    return NextResponse.json({ ok: true });
  }

  // ── Announcement notification ─────────────────────────────────────────────
  if (type === "announcement") {
    const { title, body: annBody, authorName } = body as {
      title: string;
      body: string;
      authorName: string;
    };

    // Get all authorized + admin member IDs (excluding sender)
    const { data: members } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("role", ["authorized", "admin"])
      .neq("id", user.id);

    if (!members?.length) return NextResponse.json({ ok: true });

    // Batch-fetch their emails
    const emailResults = await Promise.all(
      members.map((m) => admin.auth.admin.getUserById(m.id))
    );

    const recipients = members
      .map((m, i) => ({
        name: m.full_name,
        email: emailResults[i].data?.user?.email,
      }))
      .filter((r): r is { name: string; email: string } => !!r.email);

    // Send all in parallel (Resend handles rate limiting)
    await Promise.all(
      recipients.map((r) =>
        resend.emails.send({
          from: `HAIG <${FROM}>`,
          to:   r.email,
          subject: `📢 New announcement: ${title}`,
          html: emailTemplate({
            title: "New Announcement",
            greeting: `Hey ${r.name},`,
            body: `<strong>${authorName}</strong> posted a new announcement:`,
            quote: annBody.length > 300 ? annBody.slice(0, 300) + "…" : annBody,
            ctaLabel: "View Announcement",
            ctaUrl: `${APP_URL}/messages`,
          }),
        })
      )
    );

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// ── Email HTML template ───────────────────────────────────────────────────────

function emailTemplate({
  title,
  greeting,
  body,
  quote,
  ctaLabel,
  ctaUrl,
}: {
  title: string;
  greeting: string;
  body: string;
  quote: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;">

          <!-- Logo/header -->
          <tr>
            <td style="padding-bottom:32px;" align="center">
              <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">HAIG</span>
              <span style="font-size:12px;color:#7c7c80;display:block;margin-top:4px;">High Agency Investment Group</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1c1c1e;border-radius:16px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
              <!-- Accent bar -->
              <div style="height:3px;background:linear-gradient(90deg,#0a84ff,#30d158);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:15px;color:#aeaeb2;">${greeting}</p>
                    <p style="margin:0 0 20px;font-size:15px;color:#aeaeb2;">${body}</p>

                    <!-- Quote block -->
                    <div style="background:#2c2c2e;border-left:3px solid #0a84ff;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:28px;">
                      <p style="margin:0;font-size:14px;color:#fff;line-height:1.6;white-space:pre-line;">${quote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                    </div>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#0a84ff;border-radius:10px;">
                          <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">${ctaLabel} →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#636366;">
                You're receiving this because you're a member of HAIG.<br/>
                <a href="${ctaUrl}" style="color:#0a84ff;text-decoration:none;">Open App</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
