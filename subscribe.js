export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  try {
    const formId = process.env.CONVERTKIT_FORM_ID;
    const apiKey = process.env.CONVERTKIT_API_KEY;

    if (!formId || !apiKey) {
      res.status(500).json({ ok: false, error: "missing_env" });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const email = String(body?.email ?? "").trim();
    if (!email || email.length < 5) {
      res.status(400).json({ ok: false, error: "invalid_email" });
      return;
    }

    const payload = {
      api_key: apiKey,
      email,
      tags: body?.tags,
    };

    const ck = await fetch(`https://api.convertkit.com/v3/forms/${encodeURIComponent(formId)}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await ck.json().catch(() => ({}));
    if (!ck.ok) {
      res.status(502).json({ ok: false, error: "convertkit_error", status: ck.status, data });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: "server_error" });
  }
}
