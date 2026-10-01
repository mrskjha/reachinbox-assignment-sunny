"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { fetchUserEmails } from "@/lib/api";
import { EmailJob } from "@/components/EmailItem";

interface EmailContextType {
  dbUserId: string | null;
  setDbUserId: (id: string) => void;
  allEmails: EmailJob[];
  searchedEmails: EmailJob[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  handleSearch: (query: string) => void;
  loadAllEmails: (userId: string) => Promise<void>;
  scheduledCount: number;
  sentCount: number;
  displayEmails: EmailJob[];
  selectedEmail: EmailJob | null; 
  setSelectedEmail: (email: EmailJob | null) => void; 
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: ReactNode }) {
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [allEmails, setAllEmails] = useState<EmailJob[]>([]);
  const [searchedEmails, setSearchedEmails] = useState<EmailJob[]>([]);
  const [activeTab, setActiveTab] = useState("scheduled");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);

  const loadAllEmails = useCallback(async (userId: string) => {
    try {
      const data = await fetchUserEmails(userId, "");
      setAllEmails(data);
    } catch (error) {
      console.error("Failed to fetch emails", error);
    }
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!dbUserId) return;
    
    if (query.trim() === "") {
      setSearchedEmails([]);
    } else {
      try {
        const data = await fetchUserEmails(dbUserId, query);
        setSearchedEmails(data);
      } catch (error) {
        console.error("Search failed", error);
      }
    }
  };

  // Derived States (Calculated on the fly)
  const scheduledCount = allEmails.filter(e => e.status === "SCHEDULED").length;
  const sentCount = allEmails.filter(e => e.status === "SENT").length;

  const listToFilter = searchQuery.trim() !== "" ? searchedEmails : allEmails;
  const displayEmails = listToFilter.filter(email => {
    if (activeTab === "scheduled") return email.status === "SCHEDULED";
    if (activeTab === "sent") return email.status === "SENT";
    return true; 
  });

  return (
    <EmailContext.Provider value={{
      dbUserId, setDbUserId, allEmails, searchedEmails,
      activeTab, setActiveTab, searchQuery, handleSearch,
      loadAllEmails, scheduledCount, sentCount, displayEmails,selectedEmail, setSelectedEmail
    }}>
      {children}
    </EmailContext.Provider>
  );
}

// Senior-level Custom Hook
export function useEmails() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error("useEmails must be used within an EmailProvider");
  }
  return context;
}