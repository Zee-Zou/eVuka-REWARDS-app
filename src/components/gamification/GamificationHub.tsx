import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LevelProgressBar from "./LevelProgressBar";
import DailyChallenge from "./DailyChallenge";
import AchievementsPanel from "./AchievementsPanel";
import StreakCalendar from "./StreakCalendar";
import SocialShare from "../social/SocialShare";
import FriendReferral from "../social/FriendReferral";
import { useToast } from "@/components/ui/use-toast";

const GamificationHub = () => {
  const { toast } = useToast();

  const handleClaimReward = () => {
    toast({
      title: "Reward Claimed!",
      description:
        "You've earned 50 bonus points for completing the daily challenge!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
          <div className="space-y-6">
            <LevelProgressBar />
            <DailyChallenge onClaim={handleClaimReward} />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Activity Streak</h2>
          <StreakCalendar />
        </div>
      </div>

      <Tabs defaultValue="achievements">
        <TabsList className="mb-4">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="social">Social & Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          <AchievementsPanel />
        </TabsContent>

        <TabsContent value="social">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SocialShare />
            <FriendReferral />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GamificationHub;
