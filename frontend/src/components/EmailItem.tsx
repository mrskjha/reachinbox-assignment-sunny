"use client"
import { Clock, Star } from "lucide-react";

export interface EmailJob {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
}

interface EmailItemProps {
  email: EmailJob;
  onClick: () => void; 
}

export default function EmailItem({ email, onClick }: EmailItemProps) {
  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  };

  return (
    <div 
      onClick={onClick}   
      className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 group cursor-pointer"
    >
      <div className="w-[20%] font-medium text-gray-800 text-sm truncate pr-4">
        To: {email.recipient.split("@")[0]}
      </div>

      <div className="flex-1 flex items-center">
        {email.status !== "SENT" && (
          <span className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 mr-4 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            {formatDateTime(email.scheduledAt)}
          </span>
        )}

        <div className="flex-1 truncate text-sm">
          <span className="font-semibold text-gray-800 bg-gray-200 px-2 py-1 rounded-2xl mr-2">
            {email.status.toLowerCase()}
          </span>
          <span className="font-semibold text-gray-800 ml-2">
            {email.subject}
          </span>
          <span className="text-gray-400 ml-2">
            {email.body}
          </span>
        </div>
      </div>

      <div className="pl-4">
        <Star className="w-4 h-4 text-gray-300 hover:text-yellow-400 transition-colors" />
      </div>
    </div>
  );
}