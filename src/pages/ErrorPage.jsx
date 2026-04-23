import { useRouteError, Link, isRouteErrorResponse } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeft, Home, RefreshCcw, ShieldAlert, Globe } from "lucide-react";
import { Button } from "../app/components/ui/button";
import { Card, CardContent } from "../app/components/ui/card";
import Logo from "../app/components/shared/Logo";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  let title = "System Exception";
  let message = "An unexpected error has occurred within the TerraTrace node.";
  let Icon = AlertCircle;
  let colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Registry Entry Not Found";
      message = "The requested land record or page does not exist in the centralized MINDCAF database.";
      Icon = ShieldAlert;
      colorClass = "text-red-500 bg-red-500/10 border-red-500/20";
    } else if (error.status === 401) {
      title = "Unauthorized Access";
      message = "You do not have the required credentials to access this secure MINDCAF node.";
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center relative z-10"
      >
        {/* Flagship Brand Header */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <Logo variant="light" className="scale-150 mb-4" />
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#002147]/20 to-transparent" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#002147]/40">
            Official Land Registry Protocol
          </p>
        </div>

        {/* Cinematic Error Card */}
        <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,33,71,0.15)] rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-2xl ring-1 ring-black/5">
          <CardContent className="p-12 md:p-16 space-y-8">
            <div className={`w-24 h-24 rounded-[2rem] ${colorClass} border flex items-center justify-center mx-auto shadow-xl`}>
              <Icon className="w-12 h-12" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-black font-['Syne'] text-[#002147] tracking-tight">
                {title}
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto font-medium">
                {message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline" 
                className="flex-1 h-14 rounded-2xl gap-3 font-bold text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload System
              </Button>
              <Button 
                asChild
                className="flex-1 h-14 rounded-2xl bg-[#002147] hover:bg-blue-900 text-white gap-3 font-bold shadow-xl shadow-blue-900/20 transition-all active:scale-95 group"
              >
                <Link to="/">
                  <Home className="w-4 h-4" />
                  Return Home
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 space-y-4"
        >
          <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-emerald-500" />
              Mindcaf Network
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Node: Littoral-01</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Ver: 2026.4.23</span>
          </div>
          
          <p className="text-[11px] font-bold text-[#002147] opacity-20 font-['Syne']">
            TERRATRACE SECURITY PROTOCOL // DEPLOYED BY MINDCAF
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ArrowRight(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
