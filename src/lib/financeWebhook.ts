const KEY = (userId: string) => `finance_webhook_url:${userId}`;

export function getWebhookUrl(userId?: string | null): string {
  if (!userId) return '';
  try { return localStorage.getItem(KEY(userId)) || ''; } catch { return ''; }
}

export function setWebhookUrl(userId: string, url: string) {
  try { localStorage.setItem(KEY(userId), url); } catch {}
}

export async function fireFinanceWebhook(userId: string | undefined, event: string, payload: Record<string, unknown>) {
  const url = getWebhookUrl(userId);
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors',
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