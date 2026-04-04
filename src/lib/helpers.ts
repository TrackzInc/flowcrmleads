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
