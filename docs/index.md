---
title: sirgas2000-utm — conversão UTM ↔ latitude/longitude no SIRGAS 2000
---

# sirgas2000-utm

Biblioteca **open-source (MIT)** para converter coordenadas **UTM ↔ latitude/longitude no SIRGAS 2000**, o datum oficial do Brasil, com fuso automático, código EPSG e graus-minutos-segundos no formato brasileiro. Feita pela **[Phreatica](https://phreatica.com)**.

## Como funciona a UTM no Brasil
- O Brasil fica nos **fusos 18 a 25** (de oeste para leste). Cada fuso tem 6° de largura e um **meridiano central (MC)**. Exemplo: fuso 23, MC −45°, que inclui São Paulo, Rio de Janeiro e Belo Horizonte.
- No **hemisfério sul**, o norte (N) recebe um falso norte de 10.000.000 m; o leste (E), um falso leste de 500.000 m. O fator de escala no MC é 0,9996.
- Códigos **EPSG** do SIRGAS 2000 / UTM sul: 31977 (17S) a 31985 (25S). Exemplos: 31982 (22S), 31983 (23S), 31984 (24S).

## Exemplos

```ts
import { paraUTM, paraGeograficas } from "sirgas2000-utm";

const u = paraUTM(-15.7939, -47.8828);   // Brasília
// u.fuso = 23, u.hemisferio = "S", u.epsg = 31983

paraGeograficas(u.E, u.N, u.fuso, u.hemisferio);
```

### Projeto que cruza dois fusos
Para manter todos os pontos de uma área no **mesmo fuso**, force o fuso:

```ts
paraUTM(-23.0, -45.5, { fuso: 22 });
```

A precisão continua submilimétrica fora do fuso de origem (até alguns graus do MC), mas a deformação de escala cresce com a distância ao MC.

### Graus, minutos e segundos

```ts
gmsParaDecimal(`23°32'51,2"S`);   // -23,547556
gmsParaDecimal("46º38'10\"O");    // -46,636111 (O = oeste)
decimalParaGms(-23.547556, "lat"); // 23°32'51,20"S
```

## Precisão e método
Séries de Krüger na forma de Karney (2011), com termos até n⁶ no elipsoide GRS80 (a = 6.378.137 m; f = 1/298,257222101). Os testes comparam com o proj4 em uma grade de pontos sobre todo o território brasileiro: erro < 1 mm na ida e < 10⁻⁹ grau na volta.

## Datum
A biblioteca não converte entre datums (SAD69, Córrego Alegre → SIRGAS 2000). Para isso, use os parâmetros e as grades oficiais do IBGE.

---

Código: [github.com/phreatica/sirgas2000-utm](https://github.com/phreatica/sirgas2000-utm) · Também da Phreatica: [hidroquimica](https://phreatica.github.io/hidroquimica/) (Piper, Stiff, balanço iônico) · [Ferramentas grátis de hidrogeologia](https://phreatica.com/ferramentas/)
