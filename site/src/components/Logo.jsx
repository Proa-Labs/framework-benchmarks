export function Logo({ row, size = 18 }) {
  return (
    <span
      className="fw-logo-mark"
      style={{
        "--logo-mask": `url('${row.id === "jte" ? "/logos/jte-mark.svg" : `/${row.logo}`}')`,
      }}
      aria-hidden="true"
    >
      <img
        className="fw-logo"
        data-logo={row.id}
        src={`/${row.logo}`}
        width={size}
        height={size}
        alt=""
      />
    </span>
  );
}
