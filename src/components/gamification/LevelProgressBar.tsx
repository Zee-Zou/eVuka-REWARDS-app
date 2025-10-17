import React from "react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface LevelProgressBarProps {
  currentLevel?: number;
  currentPoints?: number;
  pointsToNextLevel?: number;
  totalPointsForCurrentLevel?: number;
}

const LevelProgressBar = ({
  currentLevel = 5,
  currentPoints = 2300,
  pointsToNextLevel = 700,
  totalPointsForCurrentLevel = 1000,
}: LevelProgressBarProps) => {
  const progressPercentage = Math.min(
    100,
    Math.round(
      ((totalPointsForCurrentLevel - pointsToNextLevel) /
        totalPointsForCurrentLevel) *
        100,
    ),
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg"
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 1] }}
            transition={{ duration: 0.5 }}
          >
            {currentLevel}
          </motion.div>
          <div>
            <h3 className="font-bold">Level {currentLevel}</h3>
            <p className="text-xs text-muted-foreground">
              {currentPoints} total points
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">Next Level</p>
          <p className="text-xs text-muted-foreground">
            {pointsToNextLevel} points needed
          </p>
        </div>
      </div>

      <div className="relative pt-1">
        <Progress value={progressPercentage} className="h-3" />

        {/* Level markers */}
        <div className="absolute top-0 left-0 w-full flex justify-between px-1">
          <div className="w-2 h-2 rounded-full bg-background border-2 border-primary mt-0.5" />
          <div className="w-2 h-2 rounded-full bg-background border-2 border-primary mt-0.5" />
        </div>

        {/* Current level badge */}
        <motion.div
          className="absolute top-0 left-0 transform -translate-y-1/2"
          style={{ left: `${progressPercentage}%` }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="w-4 h-4 rounded-full bg-primary border-2 border-background" />
        </motion.div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Level {currentLevel}</span>
        <span>Level {currentLevel + 1}</span>
      </div>
    </div>
  );
};

export default LevelProgressBar;
