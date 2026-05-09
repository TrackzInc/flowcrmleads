const KEY = (userId: string) => `finance_webhook_url:${userId}`;
const SECRET_KEY = (userId: string) => `finance_webhook_secret:${userId}`;

export function getWebhookUrl(userId?: string | null): string {
  if (!userId) return '';
  try { return localStorage.getItem(KEY(userId)) || ''; } catch { return ''; }
}

export function setWebhookUrl(userId: string, url: string) {
  try { localStorage.setItem(KEY(userId), url); } catch {}
}

export function getWebhookSecret(userId?: string | null): string {
  if (!userId) return '';
  try { return localStorage.getItem(SECRET_KEY(userId)) || ''; } catch { return ''; }
}

export function setWebhookSecret(userId: string, secret: string) {
  try { localStorage.setItem(SECRET_KEY(userId), secret); } catch {}
}

export async function fireFinanceWebhook(userId: string | undefined, event: string, payload: Record<string, unknown>) {
  const url = getWebhookUrl(userId);
  if (!url) return;
  const secret = getWebhookSecret(userId);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['Authorization'] = `Bearer ${secret}`;
    headers['X-Webhook-Secret'] = secret;
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        source: 'flowcrm',
        data: payload,
      }),
    });
  } catch (e) {
    console.warn('finance webhook failed', e);
  }
}