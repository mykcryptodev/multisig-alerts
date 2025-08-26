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

const lilitaOne = localFont({
  src: [
    {
      path: "../../public/fonts/Segment/LilitaOne-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-lilita",
});

export const metadata: Metadata = {
  title: "Siggy - Smart Multisig Notifications",
  description: "Siggy the Parrot keeps watch over your Gnosis Safe multisigs! Get instant notifications when transactions need your signature.",
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
        <link rel="icon" href="/images/siggy.png" />
      </head>
      <body className={`${segment.variable} ${lilitaOne.variable} antialiased`}>
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
