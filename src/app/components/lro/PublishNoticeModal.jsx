import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import api from "../../../utils/api";

export function PublishNoticeModal({ open, onClose, request }) {
  const [publicationMessage, setPublicationMessage] = useState("The land in question is about to be transferred.");
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (open) {
      api.get('/config').then(res => {
        if (res.data.success) setConfig(res.data.data);
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      const durationDays = config?.noticeDurationDays || 30;
      const testMode = config?.noticeTestMode;
      const testMinutes = config?.noticeTestMinutes || 10;

      const durationMs = testMode 
        ? testMinutes * 60 * 1000 
        : durationDays * 24 * 60 * 60 * 1000;

      await api.patch(`/transfer/${request._id}/status`, { 
        status: 'Public_Notice',
        feedback: publicationMessage,
        publicNotice: {
          startDate: new Date(),
          endDate: new Date(Date.now() + durationMs)
        }
      });
      toast.success("Public Notice Published Successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to publish notice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-['Syne']">
            Publish 30-Day Public Notice
          </DialogTitle>
          <DialogDescription>
            Issue a public claim notification for land transfer verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-400">
              <p className="font-semibold mb-1">Important Notice</p>
              <p>
                This will publish a platform-wide notification allowing the public 30
                days to file any claims or disputes regarding this land plot. The transfer
                cannot proceed until this period expires without opposition.
              </p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-xl">
             <Label className="text-[10px] uppercase font-bold text-muted-foreground">Target Plot</Label>
             <p className="font-mono font-bold text-blue-700">{request?.plot?.landCode}</p>
             <p className="text-xs text-muted-foreground mt-1">{request?.plot?.location}</p>
          </div>

          <div>
            <Label htmlFor="message">Publication Message</Label>
            <Textarea
              id="message"
              value={publicationMessage}
              onChange={(e) => setPublicationMessage(e.target.value)}
              placeholder="Enter the public notice message..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This message will be visible to all platform users
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-sm">
              <span className="font-semibold">Publication Period:</span> {config?.noticeTestMode ? `${config?.noticeTestMinutes} Minutes` : `${config?.noticeDurationDays || 30} Days`} (Expires:{" "}
              {new Date(Date.now() + (config?.noticeTestMode ? (config?.noticeTestMinutes || 10) * 60 * 1000 : (config?.noticeDurationDays || 30) * 24 * 60 * 60 * 1000)).toLocaleDateString()})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[var(--terra-navy)] hover:bg-blue-900 text-white"
          >
            Publish Notice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
