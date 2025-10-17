import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Facebook, Instagram, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SocialShareProps {
  points?: number;
  achievement?: string;
}

const SocialShare = ({
  points = 1250,
  achievement = "Level 5 Rewards Member",
}: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareMessage = `I just earned ${points} points and reached ${achievement} on eVuka Rewards! Join me and start earning rewards for your shopping receipts. #eVukaRewards #ReceiptRewards`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Share text has been copied to your clipboard.",
    });
  };

  const handleShare = (platform: string) => {
    let url = "";
    const encodedMessage = encodeURIComponent(shareMessage);
    const appUrl = encodeURIComponent(window.location.origin);

    switch (platform) {
      case "twitter":
        url = `https://x.com/intent/tweet?text=${encodedMessage}&url=${appUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${appUrl}&quote=${encodedMessage}`;
        break;
      case "instagram":
        // Instagram doesn't have a direct web sharing API, so we'll just copy to clipboard
        // and show instructions
        navigator.clipboard.writeText(shareMessage);
        toast({
          title: "Instagram Sharing",
          description:
            "Message copied! Open Instagram and paste in your story or post.",
        });
        return;
      default:
        break;
    }

    if (url) {
      window.open(url, "_blank", "width=600,height=400");
      toast({
        title: "Sharing",
        description: `Opening ${platform} to share your achievement.`,
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Share2 size={18} />
        <h3 className="font-bold">Share Your Achievement</h3>
      </div>

      <Textarea value={shareMessage} readOnly className="mb-4 h-24 text-sm" />

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-[#000000] text-white hover:bg-[#333333]"
          onClick={() => handleShare("twitter")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-0"
          >
            <path
              d="M16.99 0H20.298L13.071 8.26L21.573 19.5H14.916L9.702 12.683L3.736 19.5H0.426L8.156 10.665L0 0H6.826L11.539 6.231L16.99 0ZM15.829 17.52H17.662L5.83 1.876H3.863L15.829 17.52Z"
              fill="currentColor"
            />
          </svg>
          X
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-[#4267B2] text-white hover:bg-[#3b5998]"
          onClick={() => handleShare("facebook")}
        >
          <Facebook size={16} />
          Facebook
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-[#E1306C] text-white hover:bg-[#c13584]"
          onClick={() => handleShare("instagram")}
        >
          <Instagram size={16} />
          Instagram
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 ml-auto"
          onClick={handleCopy}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </Card>
  );
};

export default SocialShare;
