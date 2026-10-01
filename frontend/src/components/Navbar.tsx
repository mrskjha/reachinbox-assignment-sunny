import { signOut, useSession } from "next-auth/react";
import { Clock, Send, ChevronDown } from "lucide-react";
import { useEmails } from "@/context/EmailContext";

export default function Navbar() {
  const { data: session } = useSession();
  const { activeTab, setActiveTab, scheduledCount, sentCount } = useEmails();
  return (
    <aside className="w-64 h-full bg-white border-r border-gray-100 flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-widest text-black">OMB</h1>
      </div>

      <div
        onClick={() => signOut()}
        title="Click to logout"
        className="flex items-center justify-between p-2 mb-6 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 shrink-0"></div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email || "email@example.com"}
            </p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
      </div>

      <button
        onClick={() => setActiveTab("compose")}
        className={`w-full py-2.5 mb-8 rounded-full font-medium transition-colors flex items-center justify-center ${
          activeTab === "compose"
            ? "bg-green-50 text-green-700 border border-green-600"
            : "bg-white text-green-600 border border-green-600 hover:bg-green-50"
        }`}
      >
        Compose
      </button>

      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-400 mb-4 px-2 uppercase tracking-wider">
          Core
        </p>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
              activeTab === "scheduled"
                ? "text-gray-900 bg-gray-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" />
              Scheduled
            </div>
            <span className="text-xs text-gray-400">{scheduledCount}</span>
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
              activeTab === "sent"
                ? "text-gray-900 bg-gray-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5" />
              Sent
            </div>
            <span className="text-xs text-gray-400">{sentCount}</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
