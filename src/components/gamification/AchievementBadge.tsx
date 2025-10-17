import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, Medal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: "trophy" | "star" | "award" | "medal";
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  date?: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

const AchievementBadge = ({
  achievement,
  size = "md",
  showProgress = true,
}: AchievementBadgeProps) => {
  const { name, description, icon, unlocked, progress, maxProgress } =
    achievement;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const getIcon = () => {
    switch (icon) {
      case "trophy":
        return <Trophy size={iconSize[size]} />;
      case "star":
        return <Star size={iconSize[size]} />;
      case "award":
        return <Award size={iconSize[size]} />;
      case "medal":
        return <Medal size={iconSize[size]} />;
      default:
        return <Trophy size={iconSize[size]} />;
    }
  };

  const progressPercentage =
    progress !== undefined && maxProgress
      ? Math.min(100, Math.round((progress / maxProgress) * 100))
      : unlocked
        ? 100
        : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${unlocked ? "bg-yellow-100" : "bg-gray-200"} ${unlocked ? "text-yellow-600" : "text-gray-400"} relative overflow-hidden`}
            >
              {/* Progress circle */}
              {showProgress &&
                progressPercentage > 0 &&
                progressPercentage < 100 && (
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${progressPercentage * 2.83}, 283`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      opacity="0.3"
                    />
                  </svg>
                )}

              {/* Icon */}
              <div className={`z-10 ${unlocked ? "animate-pulse" : ""}`}>
                {getIcon()}
              </div>

              {/* Locked overlay */}
              {!unlocked && (
                <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-gray-400" />
                </div>
              )}
            </motion.div>

            {/* Unlocked indicator */}
            {unlocked && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs bg-green-500 text-white"
              >
                ✓
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-center">
            <p className="font-bold">{name}</p>
            <p className="text-xs">{description}</p>
            {showProgress && progress !== undefined && maxProgress && (
              <p className="text-xs mt-1">
                Progress: {progress}/{maxProgress} ({progressPercentage}%)
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AchievementBadge;
