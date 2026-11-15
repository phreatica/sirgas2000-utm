/**
 * Graus, minutos e segundos (GMS) ↔ graus decimais, aceitando a escrita brasileira:
 * 23°32'51,2"S · 23 32 51.2 S · -23°32'51" · 46°38'W · 46º38'10"O (O = oeste).
 */
export function gmsParaDecimal(texto: string): number {
  const t = texto
    .trim()
    .toUpperCase()
    .replace(/,/g, ".")
    .replace(/[º°˚]/g, " ")
    .replace(/[′'’]/g, " ")
    .replace(/[″"”]/g, " ");
  const hemi = t.match(/[NSLEWO]\s*$/)?.[0];
  const corpo = hemi ? t.slice(0, t.length - 1) : t;
  const partes = corpo.trim().split(/\s+/).filter(Boolean).map(Number);
  if (partes.length === 0 || partes.length > 3 || partes.some((p) => !Number.isFinite(p))) {
    throw new SyntaxError(`Coordenada GMS inválida: "${texto}"`);
  }
  const [g, m = 0, s = 0] = partes;
  if (m < 0 || m >= 60 || s < 0 || s >= 60) throw new RangeError(`Minutos ou segundos fora de 0–60: "${texto}"`);
  const negativo = g < 0 || Object.is(g, -0) || hemi === "S" || hemi === "W" || hemi === "O";
  const valor = Math.abs(g) + m / 60 + s / 3600;
  return negativo ? -valor : valor;
}

/** Graus decimais → texto GMS (ex.: −23,5475 lat → 23°32'51,00"S). */
export function decimalParaGms(valor: number, eixo: "lat" | "lon", casasSegundos = 2): string {
  if (!Number.isFinite(valor)) throw new RangeError("Valor inválido");
  const abs = Math.abs(valor);
  let g = Math.floor(abs);
  let m = Math.floor((abs - g) * 60);
  let s = (abs - g - m / 60) * 3600;
  // evita 60,00" por arredondamento
  if (Number(s.toFixed(casasSegundos)) >= 60) {
    s = 0;
    m += 1;
  }
  if (m >= 60) {
    m = 0;
    g += 1;
  }
  const hemi = eixo === "lat" ? (valor < 0 ? "S" : "N") : valor < 0 ? "W" : "E";
  const largura = casasSegundos > 0 ? casasSegundos + 3 : 2; // "05,20" ou "05"
  return `${g}°${String(m).padStart(2, "0")}'${s.toFixed(casasSegundos).replace(".", ",").padStart(largura, "0")}"${hemi}`;
}
