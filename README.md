# sirgas2000-utm

[![npm](https://img.shields.io/npm/v/sirgas2000-utm)](https://www.npmjs.com/package/sirgas2000-utm)
[![licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)

**Converta coordenadas UTM ↔ latitude/longitude no SIRGAS 2000**, com fuso automático, código EPSG e graus-minutos-segundos no formato brasileiro (`23°32'51,2"S`, `46º38'10"O`).

- **Precisão submilimétrica:** séries de Krüger na forma de Karney (2011), com termos até n⁶. Testado contra o proj4 em pontos de todos os fusos do Brasil (18 a 25), com erro < 1 mm.
- **Sem dependências**, ≈ 6 kB (≈ 2 kB gzip). Roda no navegador, Node, Deno e Workers.
- TypeScript com tipos.

📖 Documentação: **https://phreatica.github.io/sirgas2000-utm/** · 🌐 Prefere sem programar? **[Conversor UTM SIRGAS 2000 online da Phreatica](https://phreatica.com/ferramentas/conversor-utm/)**

## Instalação

```bash
npm install sirgas2000-utm
```

## Uso

```ts
import { paraUTM, paraGeograficas, gmsParaDecimal, decimalParaGms } from "sirgas2000-utm";

// Geográficas → UTM (fuso e hemisfério automáticos)
paraUTM(-23.5505, -46.6333);
// { E: 333287.915, N: 7394588.319, fuso: 23, hemisferio: "S", mc: -45, epsg: 31983 }

// UTM → geográficas
paraGeograficas(333287.915, 7394588.319, 23, "S");
// { lat: -23.5505, lon: -46.6333 }

// Forçar o fuso (projeto que cruza dois fusos) ou o hemisfério (ponto logo ao norte do equador)
paraUTM(-23.0, -45.5, { fuso: 22 });
paraUTM(2.8, -60.7, { hemisferio: "S" });

// Graus, minutos e segundos (vírgula decimal, º ou °, O ou W para oeste)
gmsParaDecimal(`23°32'51,2"S`);      // -23.547556
decimalParaGms(-46.636111, "lon");   // 46°38'10,00"W
```

Em inglês: `toUTM` e `toLatLon` são aliases de `paraUTM` e `paraGeograficas`.

## Funções

| Função | O que faz |
|---|---|
| `paraUTM(lat, lon, { fuso?, hemisferio? })` | Geográficas → UTM, com `E`, `N`, `fuso`, `hemisferio`, `mc` (meridiano central) e `epsg` |
| `paraGeograficas(E, N, fuso, hemisferio = "S")` | UTM → `{ lat, lon }` |
| `fusoDaLongitude(lon)` | Fuso 1–60 (no Brasil, 18–25) |
| `meridianoCentral(fuso)` | Ex.: 23 → −45° |
| `epsgSirgas2000(fuso, "S")` | 31977–31985 (fusos 17S–25S) |
| `gmsParaDecimal(texto)` / `decimalParaGms(valor, "lat" \| "lon")` | GMS ↔ decimal |

## Importante: datum
A biblioteca **projeta** dentro do SIRGAS 2000 (elipsoide GRS80). **Não transforma datum**: coordenadas em **SAD69** ou **Córrego Alegre** precisam antes dos parâmetros e grades oficiais do IBGE. Para a maioria dos usos, SIRGAS 2000 e WGS84 podem ser considerados equivalentes (diferença de poucos centímetros).

## Como citar
[`CITATION.cff`](CITATION.cff) ou o DOI do Zenodo de cada versão.

Referência do método: KARNEY, C. F. F. Transverse Mercator with an accuracy of a few nanometers. *Journal of Geodesy*, 85, 475–485, 2011. doi:10.1007/s00190-011-0445-3

---

## English
**UTM ↔ latitude/longitude conversion for SIRGAS 2000 (GRS80)**, the official Brazilian datum, with automatic zone, EPSG code and degree-minute-second parsing (Brazilian formats). Sub-millimetre accuracy (Krüger series, Karney 2011), validated against proj4 across all Brazilian UTM zones. Zero dependencies. Made by **[Phreatica](https://phreatica.com)** (hydrogeology and contaminated-site software).

MIT © Phreatica · Ecossistema: [Phreatica](https://phreatica.com) · [Estrato Perfis](https://estratoperfis.com.br) · [Rhoa Geo](https://rhoageo.com)
