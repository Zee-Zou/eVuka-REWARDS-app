import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Reward } from "@/lib/database.types";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

const MOCK_REWARDS: Reward[] = [
  {
    id: "1",
    title: "$10 Gift Card",
    description: "Redeem for a $10 gift card",
    points_cost: 1000,
    image_url: "https://api.dicebear.com/7.x/icons/svg?seed=gift",
    stock: 100,
    category: "Gift Cards",
  },
  {
    id: "2",
    title: "$25 Gift Card",
    description: "Redeem for a $25 gift card",
    points_cost: 2500,
    image_url: "https://api.dicebear.com/7.x/icons/svg?seed=gift2",
    stock: 50,
    category: "Gift Cards",
  },
  {
    id: "3",
    title: "Movie Tickets",
    description: "Two tickets to any movie",
    points_cost: 3000,
    image_url: "https://api.dicebear.com/7.x/icons/svg?seed=movie",
    stock: 30,
    category: "Entertainment",
  },
];

export const RewardsMarketplace = () => {
  const [rewards] = useState<Reward[]>(MOCK_REWARDS);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRedeem = async (reward: Reward) => {
    try {
      // Call your backend API to process the redemption
      // In a real app, this would be an actual API call
      // await fetch('/api/rewards/redeem', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     rewardId: reward.id,
      //     userId: user?.id,
      //   }),
      // });

      // For demo purposes, just show a success message
      setTimeout(() => {
        toast({
          title: "Success!",
          description: `You have successfully redeemed ${reward.title}`,
        });
        setSelectedReward(null);
      }, 1000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to redeem reward. Please try again.",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {rewards.map((reward) => (
        <Card key={reward.id} className="p-4">
          <img
            src={reward.image_url}
            alt={reward.title}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
          <h3 className="text-lg font-bold">{reward.title}</h3>
          <p className="text-gray-600 mb-4">{reward.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">{reward.points_cost} pts</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => setSelectedReward(reward)}>
                  Redeem
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Redemption</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to redeem {selectedReward?.title} for{" "}
                    {selectedReward?.points_cost} points?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReward(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      selectedReward && handleRedeem(selectedReward)
                    }
                  >
                    Confirm Redemption
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      ))}
    </div>
  );
};
