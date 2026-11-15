/**
 * Projeção UTM no elipsoide GRS80 (SIRGAS 2000), pelas séries de Krüger na forma de Karney (2011),
 * com termos até n⁶: precisão submilimétrica dentro do fuso.
 *
 * Referência: KARNEY, C. F. F. Transverse Mercator with an accuracy of a few nanometers.
 * Journal of Geodesy, v. 85, p. 475–485, 2011. doi:10.1007/s00190-011-0445-3
 *
 * Importante: esta biblioteca projeta coordenadas geográficas ↔ UTM no mesmo datum (SIRGAS 2000, praticamente
 * idêntico ao WGS84 para a maioria dos usos). Ela NÃO transforma datum (SAD69 ou Córrego Alegre → SIRGAS 2000);
 * para isso, use os parâmetros e grades oficiais do IBGE.
 */

/** Semieixo maior do GRS80 (m). */
export const A_GRS80 = 6378137;
/** Achatamento do GRS80. */
export const F_GRS80 = 1 / 298.257222101;
/** Fator de escala no meridiano central (UTM). */
export const K0 = 0.9996;
export const FALSO_LESTE = 500000;
export const FALSO_NORTE_SUL = 10000000;

export type Hemisferio = "N" | "S";

const n = F_GRS80 / (2 - F_GRS80);
const n2 = n * n;
const n3 = n2 * n;
const n4 = n3 * n;
const n5 = n4 * n;
const n6 = n5 * n;
const e = Math.sqrt(F_GRS80 * (2 - F_GRS80));
const e2 = e * e;

/** Raio retificante A. */
const AR = (A_GRS80 / (1 + n)) * (1 + n2 / 4 + n4 / 64 + n6 / 256);

const ALFA = [
  0,
  n / 2 - (2 / 3) * n2 + (5 / 16) * n3 + (41 / 180) * n4 - (127 / 288) * n5 + (7891 / 37800) * n6,
  (13 / 48) * n2 - (3 / 5) * n3 + (557 / 1440) * n4 + (281 / 630) * n5 - (1983433 / 1935360) * n6,
  (61 / 240) * n3 - (103 / 140) * n4 + (15061 / 26880) * n5 + (167603 / 181440) * n6,
  (49561 / 161280) * n4 - (179 / 168) * n5 + (6601661 / 7257600) * n6,
  (34729 / 80640) * n5 - (3418889 / 1995840) * n6,
  (212378941 / 319334400) * n6,
];

const BETA = [
  0,
  n / 2 - (2 / 3) * n2 + (37 / 96) * n3 - (1 / 360) * n4 - (81 / 512) * n5 + (96199 / 604800) * n6,
  (1 / 48) * n2 + (1 / 15) * n3 - (437 / 1440) * n4 + (46 / 105) * n5 - (1118711 / 3870720) * n6,
  (17 / 480) * n3 - (37 / 840) * n4 - (209 / 4480) * n5 + (5569 / 90720) * n6,
  (4397 / 161280) * n4 - (11 / 504) * n5 - (830251 / 7257600) * n6,
  (4583 / 161280) * n5 - (108847 / 3991680) * n6,
  (20648693 / 638668800) * n6,
];

const RAD = Math.PI / 180;

/** Fuso UTM (1–60) que contém a longitude (graus decimais). No Brasil, de 18 a 25. */
export function fusoDaLongitude(lon: number): number {
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new RangeError(`Longitude inválida: ${lon}`);
  return Math.min(60, Math.floor((lon + 180) / 6) + 1);
}

/** Longitude do meridiano central do fuso (graus). Ex.: fuso 23 → −45°. */
export function meridianoCentral(fuso: number): number {
  validarFuso(fuso);
  return (fuso - 1) * 6 - 180 + 3;
}

/**
 * Código EPSG do SIRGAS 2000 / UTM para o hemisfério sul (fusos 17S a 25S: EPSG 31977–31985).
 * Para o hemisfério norte retorna `undefined` (consulte o registro EPSG).
 */
export function epsgSirgas2000(fuso: number, hemisferio: Hemisferio): number | undefined {
  validarFuso(fuso);
  if (hemisferio === "S" && fuso >= 17 && fuso <= 25) return 31960 + fuso;
  return undefined;
}

function validarFuso(fuso: number) {
  if (!Number.isInteger(fuso) || fuso < 1 || fuso > 60) throw new RangeError(`Fuso UTM inválido: ${fuso}`);
}

export interface CoordenadaUTM {
  /** Coordenada leste (m). */
  E: number;
  /** Coordenada norte (m). */
  N: number;
  fuso: number;
  hemisferio: Hemisferio;
  /** Meridiano central do fuso (graus). */
  mc: number;
  /** EPSG SIRGAS 2000 (só hemisfério sul, fusos 17–25). */
  epsg?: number;
}

export interface OpcoesUTM {
  /** Força um fuso (ex.: para manter um projeto inteiro no mesmo fuso). Padrão: fuso da longitude. */
  fuso?: number;
  /** Força o hemisfério (ex.: "S" para pontos logo ao norte do equador em projetos do sul). Padrão: pelo sinal da latitude. */
  hemisferio?: Hemisferio;
}

/** Geográficas (graus decimais, SIRGAS 2000) → UTM. */
export function paraUTM(lat: number, lon: number, opcoes: OpcoesUTM = {}): CoordenadaUTM {
  if (!Number.isFinite(lat) || lat < -80 || lat > 84) throw new RangeError(`Latitude fora do domínio UTM (−80° a 84°): ${lat}`);
  const fuso = opcoes.fuso ?? fusoDaLongitude(lon);
  const hemisferio: Hemisferio = opcoes.hemisferio ?? (lat < 0 ? "S" : "N");
  const mc = meridianoCentral(fuso);

  const phi = lat * RAD;
  const lam = (lon - mc) * RAD;
  const cosLam = Math.cos(lam);
  const sinLam = Math.sin(lam);

  const tau = Math.tan(phi);
  const sigma = Math.sinh(e * Math.atanh((e * tau) / Math.sqrt(1 + tau * tau)));
  const tauL = tau * Math.sqrt(1 + sigma * sigma) - sigma * Math.sqrt(1 + tau * tau);

  const xiL = Math.atan2(tauL, cosLam);
  const etaL = Math.asinh(sinLam / Math.sqrt(tauL * tauL + cosLam * cosLam));

  let xi = xiL;
  let eta = etaL;
  for (let j = 1; j <= 6; j++) {
    xi += ALFA[j] * Math.sin(2 * j * xiL) * Math.cosh(2 * j * etaL);
    eta += ALFA[j] * Math.cos(2 * j * xiL) * Math.sinh(2 * j * etaL);
  }

  const E = FALSO_LESTE + K0 * AR * eta;
  const N = (hemisferio === "S" ? FALSO_NORTE_SUL : 0) + K0 * AR * xi;
  return { E, N, fuso, hemisferio, mc, epsg: epsgSirgas2000(fuso, hemisferio) };
}

export interface CoordenadaGeografica {
  lat: number;
  lon: number;
}

/** UTM → geográficas (graus decimais, SIRGAS 2000). */
export function paraGeograficas(E: number, N: number, fuso: number, hemisferio: Hemisferio = "S"): CoordenadaGeografica {
  if (!Number.isFinite(E) || !Number.isFinite(N)) throw new RangeError("Coordenadas UTM inválidas");
  const mc = meridianoCentral(fuso);
  const x = E - FALSO_LESTE;
  const y = N - (hemisferio === "S" ? FALSO_NORTE_SUL : 0);

  const eta = x / (K0 * AR);
  const xi = y / (K0 * AR);

  let xiL = xi;
  let etaL = eta;
  for (let j = 1; j <= 6; j++) {
    xiL -= BETA[j] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta);
    etaL -= BETA[j] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta);
  }

  const sinhEtaL = Math.sinh(etaL);
  const sinXiL = Math.sin(xiL);
  const cosXiL = Math.cos(xiL);
  const tauL = sinXiL / Math.sqrt(sinhEtaL * sinhEtaL + cosXiL * cosXiL);

  // Newton-Raphson para τ = tan φ
  let tau = tauL;
  for (let i = 0; i < 10; i++) {
    const sigma = Math.sinh(e * Math.atanh((e * tau) / Math.sqrt(1 + tau * tau)));
    const tauI = tau * Math.sqrt(1 + sigma * sigma) - sigma * Math.sqrt(1 + tau * tau);
    const delta =
      ((tauL - tauI) / Math.sqrt(1 + tauI * tauI)) * ((1 + (1 - e2) * tau * tau) / ((1 - e2) * Math.sqrt(1 + tau * tau)));
    tau += delta;
    if (Math.abs(delta) < 1e-14) break;
  }

  const lat = Math.atan(tau) / RAD;
  const lon = mc + Math.atan2(sinhEtaL, cosXiL) / RAD;
  return { lat, lon };
}
