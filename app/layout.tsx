export const metadata = { title: process.env.NEXT_PUBLIC_APP_NAME || 'Unloved' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          ::placeholder {
            color: #888;
          }
        `}</style>
      </head>
      <body style={{ margin: 24, backgroundColor: '#000', color: '#fff' }}>
        <main style={{ maxWidth: 520, margin: '0 auto' }}>{children}</main>
      </body>
    </html>
  );
}
