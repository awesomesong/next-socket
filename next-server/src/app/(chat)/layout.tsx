export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="w-full min-h-dvh bg-default">
      {children}
    </div>
  );
}