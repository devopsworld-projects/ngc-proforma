import { useState } from "react";
import { Mail, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RaiseConcernFab() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("concerns").insert({
        user_id: user.id,
        user_email: user.email || "",
        user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });

      if (error) throw error;

      // Send email notification via edge function
      await supabase.functions.invoke("send-concern-email", {
        body: {
          subject: subject.trim(),
          message: message.trim(),
          priority,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email?.split("@")[0],
        },
      });

      toast.success("Your concern has been submitted successfully! The developer will review it.");
      setSubject("");
      setMessage("");
      setPriority("medium");
      setOpen(false);
    } catch (err: any) {
      toast.error("Failed to submit concern. Please try again.");
      console.error("Concern submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 group"
        title="Raise a concern to the developer"
      >
        <Mail className="h-5 w-5" />
        <span className="hidden sm:inline text-sm font-medium">Raise a Concern</span>
      </button>

      {/* Dialog Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Raise a Concern to the Developer
            </DialogTitle>
            <DialogDescription>
              Report bugs, suggest improvements, or raise any issue. Your message will be sent directly to the developer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="concern-subject">Subject</Label>
              <Input
                id="concern-subject"
                placeholder="Brief description of your concern"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concern-priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="critical">🚨 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concern-message">Describe your concern</Label>
              <Textarea
                id="concern-message"
                placeholder="Please describe the issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !subject.trim() || !message.trim()}
              className="w-full"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Concern
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
