import "./globals.css";

export const metadata = {
  title: "AML Check API | Unified Compliance for African Fintech",
  description: "Screen users against global and African sanction lists with AI-powered fuzzy matching.",
};

import { DashboardProvider } from "@/context/DashboardContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}

