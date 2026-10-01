"use client"
import EmailItem, { EmailJob } from "./EmailItem";
import { useEmails } from "@/context/EmailContext";
interface EmailHistoryProps {
  emails: EmailJob[];
}

export default function EmailHistory({ emails }: EmailHistoryProps) {
  const { setSelectedEmail } = useEmails();
  return (
    <div className="bg-white flex flex-col w-full">
      {emails.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No emails found.</div>
      ) : (
        emails.map((email) => (
          <EmailItem key={email.id} email={email} onClick={() => setSelectedEmail(email)}/>
        ))
      )}
    </div>
  );
}