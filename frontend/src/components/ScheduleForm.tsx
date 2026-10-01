import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, Clock, ChevronDown, Bold, Italic, Underline, List, Link2,
  Upload, FileText
} from "lucide-react";
import toast from "react-hot-toast";

import { useEmails } from "@/context/EmailContext";
import { scheduleEmailJob } from "@/lib/api";

export default function ScheduleForm() {
  const { data: session } = useSession();
  const { dbUserId, loadAllEmails, setActiveTab } = useEmails();
  
  const [loading, setLoading] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    body: "",
    delay: "0",
    limit: "0",
    scheduledTime: "",
  });

  // Handle clicking outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowSchedulePopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const foundEmails = text.match(emailRegex) || [];
      
      const uniqueEmails = Array.from(new Set(foundEmails));
      
      setDetectedEmails(uniqueEmails);
      
      if (uniqueEmails.length > 0) {
        toast.success(`${uniqueEmails.length} emails detected!`);
      } else {
        toast.error("No valid emails found in the file.");
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setPresetTime = (label: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (label.includes("10:00 AM")) tomorrow.setHours(10, 0, 0);
    else if (label.includes("11:00 AM")) tomorrow.setHours(11, 0, 0);
    else if (label.includes("3:00 PM")) tomorrow.setHours(15, 0, 0);
    else tomorrow.setHours(9, 0, 0); 
    
    setFormData({ ...formData, scheduledTime: tomorrow.toISOString() });
    setShowSchedulePopup(false);
    toast.success(`Start time set for ${label}`);
  };

  const handleSchedule = async () => {
    if (!dbUserId) {
      toast.error("User ID not loaded.");
      return;
    }

    // Manual emails 
    let allRecipients = [...detectedEmails];
    if (formData.to.trim()) {
      const manualEmails = formData.to.split(',').map(e => e.trim()).filter(e => e);
      allRecipients = [...allRecipients, ...manualEmails];
    }
    
    // Duplicates remove
    allRecipients = Array.from(new Set(allRecipients));

    if (allRecipients.length === 0) {
      toast.error("Please enter an email or upload a file.");
      return;
    }
    if (!formData.subject || !formData.body) {
      toast.error("Subject and body are required.");
      return;
    }
    
    setLoading(true);
    try {
      await scheduleEmailJob({
        userId: dbUserId,
        recipient: allRecipients,
        subject: formData.subject,
        body: formData.body,
        delay: parseInt(formData.delay) || 0,
        hourlyLimit: parseInt(formData.limit) || 0,
        scheduledTime: formData.scheduledTime || new Date().toISOString(),
      });
      
      toast.success("Emails scheduled successfully!");

      setFormData({ to: "", subject: "", body: "", delay: "0", limit: "0", scheduledTime: "" });
      setDetectedEmails([]);
      loadAllEmails(dbUserId);
      setActiveTab("scheduled");
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule emails.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      <div className="flex items-center justify-between mb-8 relative">
        <div className="flex items-center gap-4 text-gray-800">
          <ArrowLeft 
            className="w-5 h-5 cursor-pointer hover:text-black transition-colors" 
            onClick={() => setActiveTab("scheduled")}
          />
          <h2 className="text-xl font-medium">Compose New Email</h2>
        </div>
        
        <div className="flex items-center gap-5">
          <Clock 
            className={`w-5 h-5 cursor-pointer transition-colors ${showSchedulePopup ? "text-green-600" : "text-gray-400 hover:text-green-700"}`}
            onClick={() => setShowSchedulePopup(!showSchedulePopup)}
          />
          <button 
            onClick={handleSchedule}
            disabled={loading}
            className="px-6 py-1.5 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Scheduling..." : "Schedule"}
          </button>
        </div>

        {showSchedulePopup && (
          <div ref={popupRef} className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-1">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-gray-800 font-medium mb-4">Start Time</h3>
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <input 
                  type="datetime-local" 
                  name="scheduledTime"
                  value={formData.scheduledTime ? formData.scheduledTime.slice(0,16) : ""}
                  onChange={handleChange}
                  className="text-sm text-gray-500 outline-none w-full bg-transparent"
                />
              </div>
            </div>
            <div className="p-2 space-y-1">
              {["Tomorrow", "Tomorrow, 10:00 AM", "Tomorrow, 11:00 AM", "Tomorrow, 3:00 PM"].map((time) => (
                <div 
                  key={time} 
                  onClick={() => setPresetTime(time)}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        
        <div className="flex items-center border-b border-gray-100 pb-3">
          <label className="w-24 text-sm text-gray-800 font-medium">From</label>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md text-sm text-gray-700 border border-gray-100">
            <span>{session?.user?.email || "user@domain.io"}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-4 flex-1">
            <label className="w-24 text-sm text-gray-800 font-medium">To</label>
            
            <div className="flex-1 flex flex-col gap-2">
              <input 
                type="text" 
                name="to"
                value={formData.to}
                onChange={handleChange}
                placeholder="Enter email (comma separated) or upload file ->"
                className="w-full text-sm outline-none placeholder-gray-400 bg-transparent"
              />
              
              {detectedEmails.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {detectedEmails.length} emails uploaded from CSV
                  </span>
                  <button 
                    onClick={() => setDetectedEmails([])}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear File
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <input 
            type="file" 
            accept=".csv, .txt" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium ml-4 shrink-0"
          >
            <Upload className="w-4 h-4" />
            Upload CSV/TXT
          </button>
        </div>

        <div className="flex items-center border-b border-gray-100 pb-3">
          <label className="w-24 text-sm text-gray-800 font-medium">Subject</label>
          <input 
            type="text" 
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Enter email subject"
            className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
          />
        </div>

        <div className="flex items-center pt-2">
          <label className="w-[180px] text-sm text-gray-800 font-medium">Delay between emails (min)</label>
          <input 
            type="number" 
            name="delay"
            min="0"
            value={formData.delay}
            onChange={handleChange}
            className="w-16 border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none text-center"
          />
          
          <label className="ml-10 mr-4 text-sm text-gray-800 font-medium">Hourly Limit</label>
          <input 
            type="number" 
            name="limit"
            min="0"
            value={formData.limit}
            onChange={handleChange}
            className="w-16 border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none text-center"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50 rounded-xl overflow-hidden min-h-[300px]">
        <div className="flex flex-wrap items-center gap-1 p-2 bg-white m-3 rounded-lg border border-gray-100 shadow-sm">
          <button className="p-1.5 text-gray-400"><Bold className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400"><Italic className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400"><Underline className="w-4 h-4" /></button>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <button className="p-1.5 text-gray-400"><List className="w-4 h-4" /></button>
          <button className="p-1.5 text-gray-400"><Link2 className="w-4 h-4" /></button>
        </div>

        <textarea
          name="body"
          value={formData.body}
          onChange={handleChange}
          placeholder="Type Your Email Body..."
          className="flex-1 w-full bg-transparent p-6 outline-none resize-none text-sm text-gray-700 placeholder-gray-400"
        />
      </div>

    </div>
  );
}
