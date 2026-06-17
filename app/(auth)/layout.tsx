export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animated fadeIn" style={{ marginTop: "50px" }}>
      {children}
    </div>
  );
}
