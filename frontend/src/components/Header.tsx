import { Search, Filter, RefreshCw } from "lucide-react";
import { useEmails } from "@/context/EmailContext";

export default function Header() {
  const { searchQuery, handleSearch, loadAllEmails, dbUserId } = useEmails();

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8">
      <div className="flex items-center w-full max-w-2xl bg-gray-50 rounded-full px-4 py-2.5">
        <Search className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-sm text-gray-800 placeholder-gray-400"
        />
      </div>
      <div className="flex items-center gap-6 ml-8">
        <Filter className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
        <RefreshCw
          onClick={() => dbUserId && loadAllEmails(dbUserId)}
          className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
        />
      </div>
    </header>
  );
}