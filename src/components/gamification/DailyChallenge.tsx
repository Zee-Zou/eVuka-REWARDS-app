import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, Clock, Award } from "lucide-react";

interface DailyChallengeProps {
  title?: string;
  description?: string;
  reward?: number;
  progress?: number;
  maxProgress?: number;
  timeRemaining?: string;
  onClaim?: () => void;
}

const DailyChallenge = ({
  title = "Scan 3 Receipts Today",
  description = "Complete today's challenge to earn bonus points",
  reward = 50,
  progress = 1,
  maxProgress = 3,
  timeRemaining = "8 hours",
  onClaim = () => {},
}: DailyChallengeProps) => {
  const progressPercentage = Math.min(
    100,
    Math.round((progress / maxProgress) * 100),
  );
  const isCompleted = progress >= maxProgress;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
          <Target size={24} />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{title}</h3>
            <div className="flex items-center text-sm text-blue-600">
              <Clock size={14} className="mr-1" />
              <span>{timeRemaining}</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">{description}</p>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {progress}/{maxProgress}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center text-amber-600">
              <Award size={18} className="mr-1" />
              <span className="font-bold">{reward} points</span>
            </div>

            <Button
              size="sm"
              disabled={!isCompleted}
              onClick={onClaim}
              className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isCompleted ? "Claim Reward" : "In Progress"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DailyChallenge;
