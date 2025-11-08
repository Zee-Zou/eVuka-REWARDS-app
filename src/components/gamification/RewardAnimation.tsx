import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "../ui/confetti";
import { Star, Award, Trophy, Zap } from "lucide-react";

interface RewardAnimationProps {
  type: "points" | "streak" | "level" | "achievement";
  value: number | string;
  show: boolean;
  onComplete?: () => void;
  duration?: number;
}

const RewardAnimation = ({
  type,
  value,
  show,
  onComplete,
  duration = 3000,
}: RewardAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  // Play sound effect when animation shows
  useEffect(() => {
    if (isVisible) {
      try {
        const audio = new Audio(
          type === "level"
            ? "https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3"
            : type === "achievement"
              ? "https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3"
              : "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
        );
        audio.volume = 0.5;
        audio.play().catch((err) => {
          // Error playing audio - continue silently
        });
      } catch (error) {
        // Audio playback not available
      }
    }
  }, [isVisible, type]);

  const getIcon = () => {
    switch (type) {
      case "points":
        return <Zap className="text-yellow-400" size={48} />;
      case "streak":
        return <Star className="text-yellow-400" size={48} />;
      case "level":
        return <Trophy className="text-yellow-400" size={48} />;
      case "achievement":
        return <Award className="text-yellow-400" size={48} />;
      default:
        return <Star className="text-yellow-400" size={48} />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case "points":
        return `+${value} Points!`;
      case "streak":
        return `${value} Day Streak!`;
      case "level":
        return `Level ${value} Reached!`;
      case "achievement":
        return typeof value === "string" ? value : "Achievement Unlocked!";
      default:
        return "Reward Earned!";
    }
  };

  const getColor = () => {
    switch (type) {
      case "points":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "streak":
        return "bg-gradient-to-r from-orange-500 to-red-500";
      case "level":
        return "bg-gradient-to-r from-blue-500 to-purple-600";
      case "achievement":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      default:
        return "bg-gradient-to-r from-blue-500 to-purple-600";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Confetti active={true} duration={duration} />

          <motion.div
            className={`rounded-lg shadow-lg p-6 text-white ${getColor()} max-w-sm mx-auto text-center`}
            initial={{ scale: 0.5, y: 50 }}
            animate={{
              scale: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
              },
            }}
            exit={{ scale: 0.5, y: 50 }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
                repeatDelay: 0.5,
              }}
              className="flex justify-center mb-4"
            >
              {getIcon()}
            </motion.div>

            <motion.h2
              className="text-2xl font-bold mb-2"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                repeat: 1,
                repeatDelay: 1,
              }}
            >
              {getMessage()}
            </motion.h2>

            <motion.p
              className="text-sm opacity-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {type === "points" && "Keep it up!"}
              {type === "streak" && "You're on fire!"}
              {type === "level" && "Awesome progress!"}
              {type === "achievement" && "Great job!"}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RewardAnimation;