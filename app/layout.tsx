export const metadata = { title: process.env.NEXT_PUBLIC_APP_NAME || 'Unloved' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 24 }}>
        <main style={{ maxWidth: 520, margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  );
}
