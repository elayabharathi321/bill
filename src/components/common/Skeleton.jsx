/**
 * Skeleton loading placeholder. Use `count` to render multiple rows.
 */
export default function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-md bg-gray-200 ${className}`}
        />
      ))}
    </>
  );
}