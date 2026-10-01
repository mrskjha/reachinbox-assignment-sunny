"use client";

import { useSession } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import AuthScreen from "@/components/AuthScreen";
import Dashboard from "@/components/Dashboard";
import { EmailProvider } from "@/context/EmailContext";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <EmailProvider>
      <Toaster position="top-right" />
      <Dashboard />
    </EmailProvider>
  );
}