import React, { useState, useEffect } from "react";
import { Progress } from "../ui/progress";
import { Card } from "../ui/card";
import { Trophy, Target, Star, Award, Zap, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateMultiplier } from "@/lib/gamification";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PointsDisplayProps {
  currentPoints?: number;
  dailyGoal?: number;
  streakDays?: number;
  potentialPoints?: number;
  level?: number;
  weeklyTotal?: number;
}

const PointsDisplay = ({
  currentPoints = 150,
  dailyGoal = 200,
  streakDays = 3,
  potentialPoints = 50,
  level = 5,
  weeklyTotal = 450,
}: PointsDisplayProps) => {
  const progress = (currentPoints / dailyGoal) * 100;
  const [multiplier, setMultiplier] = useState(1.5);
  const [showMultiplierInfo, setShowMultiplierInfo] = useState(false);
  const [nextLevelPoints, setNextLevelPoints] = useState(0);

  // Calculate next level threshold
  useEffect(() => {
    // Simple formula: each level requires level * 200 points
    setNextLevelPoints(level * 200);
  }, [level]);

  // Calculate multiplier based on streak and level
  useEffect(() => {
    setMultiplier(calculateMultiplier(streakDays, level));
  }, [streakDays, level]);

  // Calculate level progress
  const levelProgress = Math.min(100, (currentPoints / nextLevelPoints) * 100);

  return (
    <Card className="p-6 bg-white shadow-lg w-full max-w-sm">
      <div className="space-y-6">
        {/* Current Points Section */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your Points</h3>
            <motion.p
              className="text-3xl font-bold text-primary"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
            >
              {currentPoints}
            </motion.p>
            <p className="text-xs text-gray-500 mt-1">Weekly: {weeklyTotal}</p>
          </div>
          <div className="flex flex-col items-center">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <div className="flex items-center mt-1 bg-blue-100 px-2 py-0.5 rounded-full">
              <Award className="w-3 h-3 text-blue-600 mr-1" />
              <span className="text-xs font-medium text-blue-700">
                Level {level}
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Level Progress</span>
            <span>{Math.round(levelProgress)}%</span>
          </div>
          <Progress
            value={levelProgress}
            className="h-2"
            indicatorClassName="bg-blue-500"
          />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Trophy className="w-4 h-4 text-blue-500" />
            <span>
              {nextLevelPoints - currentPoints} points to Level {level + 1}
            </span>
          </div>
        </div>

        {/* Daily Goal Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Daily Goal Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            <span>{dailyGoal - currentPoints} points to goal</span>
          </div>
        </div>

        {/* Streak Section */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <motion.span
            className="text-lg font-bold text-primary"
            animate={{ scale: streakDays >= 5 ? [1, 1.1, 1] : 1 }}
            transition={{
              duration: 0.5,
              repeat: streakDays >= 5 ? Infinity : 0,
              repeatDelay: 3,
            }}
          >
            {streakDays} days
            {streakDays >= 5 && (
              <span className="text-xs ml-1 text-yellow-600">🔥</span>
            )}
          </motion.span>
        </div>

        {/* Potential Points Section */}
        {potentialPoints > 0 && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 flex items-center">
              <motion.span
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block mr-2"
              >
                ✨
              </motion.span>
              Potential points from this receipt:{" "}
              <span className="font-bold ml-1">+{potentialPoints}</span>
            </p>
          </div>
        )}

        {/* Bonus Multiplier */}
        <div className="relative">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">
                Bonus Multiplier
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      className="w-4 h-4 text-purple-400 cursor-pointer"
                      onClick={() => setShowMultiplierInfo(!showMultiplierInfo)}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Your multiplier increases with your streak and level</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <motion.span
              className="text-lg font-bold text-purple-700"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 2, repeatDelay: 5 }}
            >
              x{multiplier.toFixed(1)}
            </motion.span>
          </div>

          <AnimatePresence>
            {showMultiplierInfo && (
              <motion.div
                className="mt-2 p-3 bg-white border border-purple-100 rounded-lg shadow-sm text-xs"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="font-medium mb-1 text-purple-700">
                  How your multiplier is calculated:
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex justify-between">
                    <span>Base multiplier:</span>
                    <span className="font-medium">x1.0</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Level {level} bonus:</span>
                    <span className="font-medium">
                      +{(level >= 5 ? 0.2 : level >= 3 ? 0.1 : 0).toFixed(1)}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>{streakDays} day streak bonus:</span>
                    <span className="font-medium">
                      +
                      {(streakDays >= 7
                        ? 0.2
                        : streakDays >= 3
                          ? 0.1
                          : 0
                      ).toFixed(1)}
                    </span>
                  </li>
                  <li className="flex justify-between border-t border-purple-100 mt-1 pt-1">
                    <span className="font-medium">Total multiplier:</span>
                    <span className="font-bold text-purple-700">
                      x{multiplier.toFixed(1)}
                    </span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
};

export default PointsDisplay;
