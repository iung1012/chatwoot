import './globals.css'

export const metadata = { title: 'Admin Panel', description: 'Gerenciamento de clientes' }

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
