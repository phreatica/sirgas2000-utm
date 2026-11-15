import proj4 from "proj4";
import { describe, expect, it } from "vitest";
import { decimalParaGms, epsgSirgas2000, fusoDaLongitude, gmsParaDecimal, meridianoCentral, paraGeograficas, paraUTM } from ".";

/** Referência independente: proj4 com o GRS80 (SIRGAS 2000). */
function refUTM(lat: number, lon: number, fuso: number, sul: boolean) {
  const def = `+proj=utm +zone=${fuso} ${sul ? "+south " : ""}+ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs`;
  const [E, N] = proj4("+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs", def, [lon, lat]);
  return { E, N, def };
}

describe("fusos e meridianos", () => {
  it("fusos do Brasil", () => {
    expect(fusoDaLongitude(-73.9)).toBe(18); // Acre
    expect(fusoDaLongitude(-46.63)).toBe(23); // São Paulo
    expect(fusoDaLongitude(-34.8)).toBe(25); // João Pessoa
    expect(fusoDaLongitude(180)).toBe(60);
  });
  it("meridiano central", () => {
    expect(meridianoCentral(23)).toBe(-45);
    expect(meridianoCentral(22)).toBe(-51);
    expect(meridianoCentral(18)).toBe(-75);
  });
  it("EPSG SIRGAS 2000 sul", () => {
    expect(epsgSirgas2000(23, "S")).toBe(31983);
    expect(epsgSirgas2000(22, "S")).toBe(31982);
    expect(epsgSirgas2000(25, "S")).toBe(31985);
    expect(epsgSirgas2000(23, "N")).toBeUndefined();
  });
  it("valida entradas", () => {
    expect(() => fusoDaLongitude(200)).toThrow();
    expect(() => meridianoCentral(0)).toThrow();
    expect(() => paraUTM(-85, -45)).toThrow();
  });
});

describe("comparação com proj4 em todo o Brasil", () => {
  const pontos: [number, number][] = [];
  for (let lat = -33.5; lat <= 5.0; lat += 2.25) {
    for (let lon = -73.8; lon <= -34.9; lon += 1.7) pontos.push([lat, lon]);
  }
  // pontos nas bordas dos fusos e perto do equador
  pontos.push([-23.5505, -46.6333], [-0.0001, -51.0], [0.5, -60.7], [-15.7939, -47.8828], [-29.9, -48.0001], [-8.05, -34.88]);

  it(`direto: ${pontos.length} pontos com erro < 1 mm`, () => {
    let pior = 0;
    for (const [lat, lon] of pontos) {
      const u = paraUTM(lat, lon);
      const r = refUTM(lat, lon, u.fuso, u.hemisferio === "S");
      pior = Math.max(pior, Math.abs(u.E - r.E), Math.abs(u.N - r.N));
    }
    expect(pior).toBeLessThan(0.001);
  });

  it("inverso: volta às geográficas com erro < 1e-9 grau (~0,1 mm)", () => {
    for (const [lat, lon] of pontos) {
      const u = paraUTM(lat, lon);
      const g = paraGeograficas(u.E, u.N, u.fuso, u.hemisferio);
      expect(Math.abs(g.lat - lat)).toBeLessThan(1e-9);
      expect(Math.abs(g.lon - lon)).toBeLessThan(1e-9);
    }
  });

  it("fuso forçado (ponto fora do próprio fuso, comum em projetos que cruzam fusos)", () => {
    const u = paraUTM(-23.0, -47.9, { fuso: 23 }); // está no 23 mas a 2,9° do MC
    const r = refUTM(-23.0, -47.9, 23, true);
    expect(Math.abs(u.E - r.E)).toBeLessThan(0.001);
    const v = paraUTM(-23.0, -45.5, { fuso: 22 }); // fora do fuso 22
    const r2 = refUTM(-23.0, -45.5, 22, true);
    expect(Math.abs(v.N - r2.N)).toBeLessThan(0.001);
  });

  it("hemisfério sul forçado ao norte do equador (Roraima/Amapá)", () => {
    const u = paraUTM(2.8, -60.7, { hemisferio: "S" });
    expect(u.N).toBeGreaterThan(10_000_000);
    const g = paraGeograficas(u.E, u.N, u.fuso, "S");
    expect(g.lat).toBeCloseTo(2.8, 9);
  });
});

describe("graus, minutos e segundos", () => {
  it("lê a escrita brasileira", () => {
    expect(gmsParaDecimal(`23°32'51,2"S`)).toBeCloseTo(-23.547556, 6);
    expect(gmsParaDecimal("46º38'10\"O")).toBeCloseTo(-46.636111, 6);
    expect(gmsParaDecimal("23 32 51.2 S")).toBeCloseTo(-23.547556, 6);
    expect(gmsParaDecimal("-0 30")).toBeCloseTo(-0.5, 9);
    expect(gmsParaDecimal("10°N")).toBe(10);
    expect(() => gmsParaDecimal("23°75'S")).toThrow();
    expect(() => gmsParaDecimal("abc")).toThrow();
  });
  it("escreve GMS sem 60 segundos", () => {
    expect(decimalParaGms(-23.547556, "lat")).toBe(`23°32'51,20"S`);
    expect(decimalParaGms(-46.5, "lon", 0)).toBe(`46°30'00"W`);
    expect(decimalParaGms(-45.99999999, "lon")).toBe(`46°00'00,00"W`);
  });
});
