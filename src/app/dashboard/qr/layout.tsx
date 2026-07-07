export default function QRStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            "document.documentElement.classList.add('qr-studio-active');document.body.classList.add('qr-studio-active');",
        }}
      />
      {children}
    </>
  );
}
