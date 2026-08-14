import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ancol Connect Dashboard",
  description: "Ancol Connect - Management Dashboard (Orders, Payments, Tickets, Reconciliation)",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "256x256" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
  },
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem("stisla-theme");
                if (t === "dark") document.documentElement.classList.add("dark");
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
