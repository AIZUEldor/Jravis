import "./styles.css";
export const metadata = { title: "Jravis — Ikkinchi miya", description: "Ovoz va matn orqali jarayonlarni avtomatlashtiring" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz"><body>{children}</body></html>;
}

