export function formatMoney(amount: number, currency = "FCFA") {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function cleanWhatsappPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsappUrl(phone: string, text: string) {
  return `https://wa.me/${cleanWhatsappPhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function quotePublicUrl(token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/read/${token}`;
}

export function isUrgent(createdAt: string, opened: boolean, delayHours = 48) {
  if (opened) {
    return false;
  }

  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs >= delayHours * 60 * 60 * 1000;
}
