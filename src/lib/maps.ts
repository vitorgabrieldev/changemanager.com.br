/**
 * Transforma o que o usuário colou (um link do Google Maps, ou o <iframe>
 * inteiro copiado de "Compartilhar > Incorporar um mapa") numa URL que dá
 * pra jogar direto num `<iframe src>`, sem precisar de API key do Maps
 * Embed API. Retorna null se não reconhecer o formato (não arrisca embutir
 * um domínio arbitrário num iframe).
 */
export function toEmbeddableMapsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iframeMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  const candidate = iframeMatch ? iframeMatch[1] : trimmed;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const isGoogleMapsHost =
    /(^|\.)google\.[a-z.]+$/i.test(url.hostname) || /(^|\.)goo\.gl$/i.test(url.hostname);
  if (!isGoogleMapsHost) return null;

  if (url.pathname.includes("/maps/embed")) return url.toString();

  url.searchParams.set("output", "embed");
  return url.toString();
}
