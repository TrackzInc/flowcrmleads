export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatPhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export function whatsappLink(phone: string, message?: string) {
  let num = phone.replace(/\D/g, '');
  // Ensure country code 55
  if (!num.startsWith('55')) {
    num = '55' + num;
  }
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function generateId() {
  return crypto.randomUUID();
}

export function isOverdue(dateStr?: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
