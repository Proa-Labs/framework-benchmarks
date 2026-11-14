import { error } from "@sveltejs/kit";
import { titles, type Workload } from "../../../../../workloads.ts";
export function load({
  params,
  url,
  setHeaders,
}: {
  params: { workload: string };
  url: URL;
  setHeaders: (headers: Record<string, string>) => void;
}) {
  if (!Object.hasOwn(titles, params.workload)) error(404, "Not found");
  setHeaders({ "cache-control": "no-store" });
  return {
    workload: params.workload as Workload,
    request: url.searchParams.get("request") || "",
  };
}
