export * from "./utm";
export * from "./dms";

import { paraGeograficas, paraUTM } from "./utm";

/** Alias em inglês: geographic (lat, lon) → UTM. */
export const toUTM = paraUTM;
/** Alias em inglês: UTM → geographic (lat, lon). */
export const toLatLon = paraGeograficas;
