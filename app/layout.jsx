import { MockDataProvider } from "MockDataProvider"
import "./globals.css"

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <MockDataProvider>{children}</MockDataProvider>
      </body>
    </html>
  )
}
