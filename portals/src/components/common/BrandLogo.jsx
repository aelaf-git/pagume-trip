import logo from "../../assets/branding/logo.png";

const SIZE = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export default function BrandLogo({
  size = "md",
  showWordmark = true,
  wordmark = "Pagume Trip",
  wordmarkClassName = "text-gray-900",
  className = "",
}) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <img
        src={logo}
        alt={showWordmark ? "" : "Pagume Trip"}
        className={`${SIZE[size]} rounded-[22%] object-cover shrink-0 shadow-sm`}
      />
      {showWordmark && (
        <span className={`font-semibold truncate ${wordmarkClassName}`}>{wordmark}</span>
      )}
    </div>
  );
}
