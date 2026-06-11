export const metadata = {
  title: 'Clarity — For ADHD Minds',
  description: 'Un compagnon IA pour les entrepreneurs TDAH',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230D1117'/><circle cx='50' cy='50' r='30' fill='%23091628'/><circle cx='50' cy='50' r='19' fill='%230d2040'/><circle cx='50' cy='50' r='11' fill='%232D7DD2'/><circle cx='50' cy='50' r='5.5' fill='%235BB5F5'/><circle cx='50' cy='50' r='2' fill='white'/><line x1='50' y1='14' x2='50' y2='22' stroke='%2338BDF8' stroke-width='2.5' stroke-linecap='round' opacity='0.7'/><line x1='50' y1='86' x2='50' y2='78' stroke='%2338BDF8' stroke-width='2.5' stroke-linecap='round' opacity='0.7'/><line x1='14' y1='50' x2='22' y2='50' stroke='%2338BDF8' stroke-width='2.5' stroke-linecap='round' opacity='0.7'/><line x1='86' y1='50' x2='78' y2='50' stroke='%2338BDF8' stroke-width='2.5' stroke-linecap='round' opacity='0.7'/><line x1='24' y1='24' x2='30' y2='30' stroke='%2338BDF8' stroke-width='2' stroke-linecap='round' opacity='0.4'/><line x1='76' y1='24' x2='70' y2='30' stroke='%2338BDF8' stroke-width='2' stroke-linecap='round' opacity='0.4'/><line x1='24' y1='76' x2='30' y2='70' stroke='%2338BDF8' stroke-width='2' stroke-linecap='round' opacity='0.4'/><line x1='76' y1='76' x2='70' y2='70' stroke='%2338BDF8' stroke-width='2' stroke-linecap='round' opacity='0.4'/></svg>"/>
      </head>
      <body style={{margin:0, padding:0, background:'#060810'}}>{children}</body>
    </html>
  )
}
