export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 1) return `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
  if (diffHours >= 1) return `Hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  if (diffMinutes >= 1) return `Hace ${diffMinutes} ${diffMinutes === 1 ? "minuto" : "minutos"}`;
  return "Hace un momento";
}

export function stripHtml(html: string): string {
  if (!html) return "";
  let result = "";
  let inside = false;
  for (const char of html) {
    if (char === "<") { inside = true; continue; }
    if (char === ">") { inside = false; continue; }
    if (!inside) result += char;
  }
  return result;
}
