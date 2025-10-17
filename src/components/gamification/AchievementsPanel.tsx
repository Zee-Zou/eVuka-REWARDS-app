import React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AchievementBadge, { Achievement } from "./AchievementBadge";
import { Progress } from "@/components/ui/progress";

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "1",
    name: "First Scan",
    description: "Scan your first receipt",
    icon: "trophy",
    unlocked: true,
    date: "2023-05-15",
  },
  {
    id: "2",
    name: "Scan Streak",
    description: "Scan receipts for 5 days in a row",
    icon: "star",
    unlocked: true,
    date: "2023-05-20",
  },
  {
    id: "3",
    name: "Big Spender",
    description: "Scan a receipt with a total over $100",
    icon: "award",
    unlocked: false,
    progress: 85,
    maxProgress: 100,
  },
  {
    id: "4",
    name: "Variety Shopper",
    description: "Scan receipts from 10 different stores",
    icon: "medal",
    unlocked: false,
    progress: 4,
    maxProgress: 10,
  },
  {
    id: "5",
    name: "Points Collector",
    description: "Earn 1000 points total",
    icon: "star",
    unlocked: false,
    progress: 750,
    maxProgress: 1000,
  },
  {
    id: "6",
    name: "Sharing is Caring",
    description: "Share your achievements on social media",
    icon: "award",
    unlocked: false,
  },
];

const AchievementsPanel = () => {
  const unlockedAchievements = MOCK_ACHIEVEMENTS.filter((a) => a.unlocked);
  const inProgressAchievements = MOCK_ACHIEVEMENTS.filter(
    (a) => !a.unlocked && a.progress !== undefined,
  );
  const lockedAchievements = MOCK_ACHIEVEMENTS.filter(
    (a) => !a.unlocked && a.progress === undefined,
  );

  const totalProgress = Math.round(
    (unlockedAchievements.length / MOCK_ACHIEVEMENTS.length) * 100,
  );

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Achievements</h2>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {unlockedAchievements.length} of {MOCK_ACHIEVEMENTS.length} unlocked
          </span>
          <span className="text-sm font-medium">{totalProgress}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {MOCK_ACHIEVEMENTS.map((achievement) => (
              <div key={achievement.id} className="flex flex-col items-center">
                <AchievementBadge achievement={achievement} />
                <span className="text-xs mt-2 text-center line-clamp-1">
                  {achievement.name}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="unlocked">
          {unlockedAchievements.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center"
                >
                  <AchievementBadge achievement={achievement} />
                  <span className="text-xs mt-2 text-center line-clamp-1">
                    {achievement.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              You haven't unlocked any achievements yet. Start scanning receipts
              to earn them!
            </p>
          )}
        </TabsContent>

        <TabsContent value="in-progress">
          {inProgressAchievements.length > 0 ? (
            <div className="space-y-4">
              {inProgressAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-4">
                  <AchievementBadge achievement={achievement} size="sm" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">{achievement.name}</span>
                      <span className="text-xs text-gray-600">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <Progress
                      value={
                        achievement.progress && achievement.maxProgress
                          ? (achievement.progress / achievement.maxProgress) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No achievements in progress.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AchievementsPanel;
