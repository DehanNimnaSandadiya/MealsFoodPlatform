export function BrandLogo({ size = 32, className = "", alt = "meals" }) {
  return (
    <img
      src="/Logo.png"
      alt={alt}
      decoding="async"
      loading="eager"
      style={{ height: size, width: "auto" }}
      className={className}
    />
  );
}

