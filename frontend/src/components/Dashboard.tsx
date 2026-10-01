"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "./Navbar";
import Header from "./Header";
import ScheduleForm from "./ScheduleForm";
import EmailHistory from "./EmailHistory";
import { syncUser } from "@/lib/api";
import { useEmails } from "@/context/EmailContext";
import { Mail, X } from "lucide-react";

export default function Dashboard() {
  const { data: session } = useSession();
  const { setDbUserId, loadAllEmails, activeTab, displayEmails, selectedEmail, setSelectedEmail } = useEmails();

  // User Sync & Initial Load
  useEffect(() => {
    const handleSyncUser = async () => {
      if (session?.user?.email) {
        try {
          const userData = await syncUser(session.user.email, session.user.name);
          setDbUserId(userData.id);
          loadAllEmails(userData.id);
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    };
    handleSyncUser();
  }, [session, setDbUserId, loadAllEmails]);

  return (
    <div className="flex h-screen bg-white overflow-hidden text-black font-sans relative">
      <Navbar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {activeTab === "compose" ? (
            <div className="max-w-3xl mx-auto p-10">
              <ScheduleForm /> 
            </div>
          ) : (
            <div className="w-full">
              <EmailHistory 
                emails={displayEmails}
              />
            </div>
          )}
        </main>
      </div>

      {/* --- EMAIL DETAIL MODAL / SLIDE-OVER PANEL --- */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50 transition-all">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
            
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedEmail.status === "SENT" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                }`}>
                  {selectedEmail.status}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(selectedEmail.scheduledAt).toLocaleString()}
                </span>
              </div>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Header Info */}
            <div className="px-8 py-6 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-900">{selectedEmail.subject}</h1>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full  text-white flex items-center justify-center font-bold text-sm">
                    {selectedEmail.recipient.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">To: {selectedEmail.recipient}</p>
                    <p className="text-xs text-gray-400">Recipient Address</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Body Content */}
            <div className="px-8 py-6 flex-1 bg-white">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Message Content</div>
              <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 text-gray-700 whitespace-pre-wrap text-sm leading-relaxed min-h-[200px]">
                {selectedEmail.body}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}