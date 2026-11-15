import { fileURLToPath } from "node:url";
export default {
  compress: false,
  poweredByHeader: false,
  turbopack: { root: fileURLToPath(new URL("../../../../", import.meta.url)) },
};
