import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserPlus,
  Mail,
  Copy,
  Check,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const FriendReferral = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const referralCode = "EVUKA-FRIEND-123";
  const referralLink = `https://evuka-rewards.com/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Referral link has been copied to your clipboard.",
    });
  };

  const handleSendInvite = (e: React.FormEvent, method: string) => {
    e.preventDefault();

    if (method === "email" && !email) return;
    if (method === "whatsapp" && !phone) return;
    if (method === "snapchat" && !phone) return;

    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setSending(false);

      if (method === "email") {
        setEmail("");
        toast({
          title: "Invitation sent",
          description: `Invitation email has been sent to ${email}.`,
        });
      } else if (method === "whatsapp") {
        const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Join me on eVuka Rewards using my referral code: ${referralCode}. You'll earn points for scanning receipts! ${referralLink}`)}`;
        window.open(whatsappUrl, "_blank");
        setPhone("");
        toast({
          title: "WhatsApp opening",
          description: "Opening WhatsApp with your invitation message.",
        });
      } else if (method === "snapchat") {
        // Snapchat doesn't have a direct message API, so we'll copy to clipboard
        navigator.clipboard.writeText(
          `Join me on eVuka Rewards using my referral code: ${referralCode}. You'll earn points for scanning receipts! ${referralLink}`,
        );
        setPhone("");
        toast({
          title: "Snapchat invitation",
          description:
            "Message copied! Open Snapchat and paste to your friend.",
        });
      }
    }, 1000);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={18} />
        <h3 className="font-bold">Invite Friends & Earn</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Invite friends to join eVuka Rewards. You'll earn 500 bonus points for
        each friend who signs up and scans their first receipt!
      </p>

      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Your referral code</p>
        <div className="flex gap-2">
          <Input value={referralCode} readOnly className="font-mono" />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy referral link"}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
      </div>

      <form
        onSubmit={(e) => handleSendInvite(e, "email")}
        className="space-y-4 mb-4"
      >
        <div>
          <p className="text-sm font-medium mb-2">Send email invitation</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={sending || !email}
              className="flex items-center gap-2"
            >
              <Mail size={16} />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </form>

      <form
        onSubmit={(e) => handleSendInvite(e, "whatsapp")}
        className="space-y-4 mb-4"
      >
        <div>
          <p className="text-sm font-medium mb-2">Send WhatsApp invitation</p>
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={sending || !phone}
              className="flex items-center gap-2 bg-[#25D366] text-white hover:bg-[#128C7E]"
            >
              <Smartphone size={16} />
              {sending ? "Opening..." : "WhatsApp"}
            </Button>
          </div>
        </div>
      </form>

      <form
        onSubmit={(e) => handleSendInvite(e, "snapchat")}
        className="space-y-4"
      >
        <div>
          <p className="text-sm font-medium mb-2">Send Snapchat invitation</p>
          <div className="flex gap-2">
            <Input
              type="tel"
              placeholder="Friend's phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={sending || !phone}
              className="flex items-center gap-2 bg-[#FFFC00] text-black hover:bg-[#F7E300]"
            >
              <MessageSquare size={16} />
              {sending ? "Copying..." : "Snapchat"}
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-4 bg-blue-50 p-3 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-bold">Pro tip:</span> Share your referral code
          on social media to reach more friends at once!
        </p>
      </div>
    </Card>
  );
};

export default FriendReferral;
