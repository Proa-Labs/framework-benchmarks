import { ROOTS } from "../../../react/suite_components.mjs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({ params }) {
  const { workload } = await params;
  const root = ROOTS[workload]();
  return workload === "products"
    ? root
    : root.props.children.find((child) => child?.type === "body").props
        .children;
}
