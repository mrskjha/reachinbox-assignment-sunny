import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function AuthScreen() {
  return (
     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="p-8 bg-white rounded-xl shadow-lg text-center max-w-md w-full">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Login</h1>
    
              <button
                onClick={() => signIn("google")}
                className="w-full bg-[#E5F6EC] hover:bg-[#D5F0DF] text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <FcGoogle size={22} /> Login with Google
              </button>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 border-t border-gray-300"></div>
    
                <p className="text-gray-400 text-sm whitespace-nowrap">
                  or signup through email
                </p>
    
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              <input
                type="email"
                placeholder="email ID"
                className="w-full mt-2 border border-gray-300 rounded-lg p-2 text-black focus:ring-2  outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full mt-2 border border-gray-300 rounded-lg p-2 text-black focus:ring-2 outline-none"
              />
              <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg cursor-pointer">
                Login
              </button>
            </div>
          </div>

  );
}