import Header from "./Header";

export default function Shell({ children }) {
  return (
    <div className="min-h-screen overflow-hidden bg-mist text-ink">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-50" />
      <Header />
      {children}
    </div>
  );
}
