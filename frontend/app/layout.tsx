export const metadata = {
  title: "Credence",
  description: "Verified human + financial standing gateway — powered by World ID, Mirror, and x402 micropayments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
