import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function LandCodeInfo() {
  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base font-['Syne']">Land Code Format</CardTitle>
        </div>
        <CardDescription>
          Understanding the TerraTrace land identification system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="font-mono text-sm bg-white dark:bg-slate-900 rounded-lg p-3 border border-border shadow-sm">
            <span className="text-blue-600 dark:text-blue-400 font-bold">10005</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">05</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">54321</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-orange-600 dark:text-orange-400 font-bold">7890</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-20 font-mono font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                10005
              </div>
              <div className="text-muted-foreground">
                <span className="font-bold text-foreground">Land Type:</span> 10005 (Private) / 00050 (Public)
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-20 font-mono font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">
                05
              </div>
              <div className="text-muted-foreground border-l-2 border-purple-100 pl-2">
                <span className="font-bold text-foreground">Region:</span> 01-10 (Littoral is 05)
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-20 font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                54321
              </div>
              <div className="text-muted-foreground border-l-2 border-emerald-100 pl-2">
                <span className="font-bold text-foreground">Owner ID:</span> Last 5 digits of National ID (CNI)
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-20 font-mono font-bold text-orange-600 dark:text-orange-400 flex-shrink-0">
                7890
              </div>
              <div className="text-muted-foreground border-l-2 border-orange-100 pl-2">
                <span className="font-bold text-foreground">Plot No:</span> Official number from Titre Foncier
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground pt-3 border-t border-border leading-relaxed italic">
            This code ensures global uniqueness and links physical land documents to digital blockchain records.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
