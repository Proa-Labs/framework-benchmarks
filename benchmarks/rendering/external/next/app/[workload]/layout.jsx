export async function generateMetadata({ params }) {
  const { workload } = await params;
  return workload === "products"
    ? {}
    : {
        title:
          workload === "cards" ? "SSR Benchmark Page" : "Customer Data Table",
      };
}
export default async function Layout({ children, params }) {
  const { workload } = await params;
  return (
    <html lang={workload === "products" ? undefined : "en"}>
      <body
        className={
          workload === "table" ? "bg-gray-50 text-gray-900" : undefined
        }
      >
        {children}
      </body>
    </html>
  );
}
