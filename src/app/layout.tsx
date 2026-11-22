import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sans = localFont({
  src: [
    { path: "../../fonts/IBMPlexSans-400.woff", weight: "400" },
    { path: "../../fonts/IBMPlexSans-600.woff", weight: "600" },
  ],
  variable: "--font-plex-sans",
});
const mono = localFont({
  src: [
    { path: "../../fonts/IBMPlexMono-400.woff", weight: "400" },
    { path: "../../fonts/IBMPlexMono-600.woff", weight: "600" },
  ],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Countersign · A Terraform plan your approver can actually read",
  description: "Drop in terraform show -json. Countersign puts the destroys, replacements, open ports and wildcard IAM first, with Terraform's own reason for each, and makes the sign-off sheet, the approver's email and a plan card. Runs in your browser. Built with Hyper Elements.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
