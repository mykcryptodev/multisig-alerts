import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CustomToastContainer } from "@/components/CustomToast";
import "./globals.css";

const segment = localFont({
  src: [
    {
      path: "../../public/fonts/Segment/Segment-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Segment/Segment-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-segment",
});

export const metadata: Metadata = {
  title: "Multisig Alert",
  description: "Get notified when your Gnosis Safe multisig has pending transactions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${segment.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <CustomToastContainer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
