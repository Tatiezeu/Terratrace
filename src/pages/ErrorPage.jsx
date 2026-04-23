import { useRouteError, Link, isRouteErrorResponse } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, ArrowLeft, Home, RefreshCcw, ShieldAlert } from "lucide-react";
import { Button } from "../app/components/ui/button";
import { Card, CardContent } from "../app/components/ui/card";
import Logo from "../app/components/shared/Logo";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  let title = "System Exception";
  let message = "An unexpected error has occurred within the TerraTrace node.";
  let Icon = AlertCircle;
  let colorClass = "text-amber-500 bg-amber-50";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Registry Not Found (404)";
      message = "The requested land record or page does not exist in the decentralized database.";
      Icon = ShieldAlert;
      colorClass = "text-red-500 bg-red-50";
    } else if (error.status === 401) {
      title = "Unauthorized Access";
      message = "You do not have the required biometric or digital signatures to access this node.";
    } else if (error.status === 503) {
      title = "Node Syncing";
      message = "The system is currently syncing with the main registry. Please try again in 5 minutes.";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Outfit'] select-none">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Logo variant="dark" className="scale-125" />
        </motion.div>

        {/* Error Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardContent className="p-12 space-y-6">
              <div className={`w-20 h-20 rounded-3xl ${colorClass} flex items-center justify-center mx-auto shadow-inner`}>
                <Icon className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-black font-['Syne'] text-[#002147] tracking-tight">
                  {title}
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed px-4">
                  {message}
                </p>
              </div>

              {/* Error Detail (only in dev if needed, or keeping it clean for defense) */}
              <div className="bg-muted/50 rounded-2xl p-4 text-[10px] font-mono text-muted-foreground border border-border/50 break-words">
                ERRORCODE: {error.status || 'UNKN_SYS_ERR'} // SIG: {Math.random().toString(16).slice(2, 10).toUpperCase()}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline" 
                  className="flex-1 h-12 rounded-2xl gap-2 font-bold hover:bg-slate-100 transition-all"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Retry Connection
                </Button>
                <Button 
                  asChild
                  className="flex-1 h-12 rounded-2xl bg-[var(--terra-navy)] hover:bg-[#003d7a] text-white gap-2 font-bold shadow-lg shadow-blue-500/20 shadow-blue-900/40"
                >
                  <Link to="/">
                    <Home className="w-4 h-4" />
                    Back to Terminal
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Meta */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]"
        >
          TerraTrace Protocol v2.4.1 // Littoral Node 01
        </motion.p>
      </div>
    </div>
  );
}
