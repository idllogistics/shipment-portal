import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipTrack — Live Shipment Tracking",
  description: "Track your shipment with live photo updates.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
