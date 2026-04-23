import { useState } from "react";
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

export function PublishNoticeModal({ open, onClose }) {
  const [formData, setFormData] = useState({
    landCode: "",
    publicationMessage: "",
  });

  const handleSubmit = () => {
    toast.success("30-Day Public Notice Published!", {
      description: `Notice for ${formData.landCode} has been published platform-wide. Any claims must be filed within 30 days.`,
    });
    onClose();
    setFormData({
      landCode: "",
      publicationMessage: "",
    });
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

          <div>
            <Label htmlFor="landCode">Select Land Code</Label>
            <Select
              value={formData.landCode}
              onValueChange={(value) => setFormData({ ...formData, landCode: value })}
            >
              <SelectTrigger id="landCode">
                <SelectValue placeholder="Choose a land plot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10005-D1-54323-003">
                  10005-D1-54323-003 - Bafoussam, West
                </SelectItem>
                <SelectItem value="10005-D2-54322-002">
                  10005-D2-54322-002 - Yaoundé, Centre
                </SelectItem>
                <SelectItem value="10005-D1-54321-001">
                  10005-D1-54321-001 - Douala, Littoral
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Publication Message</Label>
            <Textarea
              id="message"
              value={formData.publicationMessage}
              onChange={(e) =>
                setFormData({ ...formData, publicationMessage: e.target.value })
              }
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
              <span className="font-semibold">Publication Period:</span> 30 days from{" "}
              {new Date().toLocaleDateString()} to{" "}
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
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
