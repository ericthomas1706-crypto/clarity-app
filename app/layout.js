export const metadata = {
  title: 'Clarity — Enfin un outil qui te comprend',
  description: 'Un compagnon IA pour les entrepreneurs TDAH',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{margin:0, padding:0, background:'#060810'}}>{children}</body>
    </html>
  )
}
