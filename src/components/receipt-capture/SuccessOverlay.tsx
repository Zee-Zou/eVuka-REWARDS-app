import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PartyPopper, Share2, Award, Trophy, ArrowRight } from "lucide-react";
import Confetti from "@/components/ui/confetti";
import { secureStore } from "@/lib/security-enhanced";

interface SuccessOverlayProps {
  isVisible?: boolean;
  pointsEarned?: number;
  onClose?: () => void;
  streakIncreased?: boolean;
  levelUp?: boolean;
  newAchievements?: string[];
}

const SuccessOverlay = ({
  isVisible = true,
  pointsEarned = 100,
  onClose = () => {},
  streakIncreased = false,
  levelUp = false,
  newAchievements = [],
}: SuccessOverlayProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Check if user has previously interacted with the page
  useEffect(() => {
    const checkInteraction = async () => {
      const interacted = await secureStore.getItem("user_interacted");
      setHasInteracted(interacted === "true");
    };

    checkInteraction();
  }, []);

  // Play success sound when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      try {
        // Only play audio if user has interacted with the page
        if (
          hasInteracted ||
          document.documentElement.hasAttribute("data-user-interacted")
        ) {
          // Store that user has interacted for future reference
          secureStore.setItem("user_interacted", "true");

          // Use a more complete success sound effect
          const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3",
          );
          audio.volume = 0.5; // Set volume to 50%
          audio.play().catch((err) => {
            // Error playing audio - continue silently
          });
        }
      } catch (error) {
        // Audio playback not available
      }
    }
  }, [isVisible, hasInteracted]);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      // Hide confetti after 3 seconds to improve performance
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Calculate total steps for the success flow
  const totalSteps =
    1 +
    (streakIncreased ? 1 : 0) +
    (levelUp ? 1 : 0) +
    (newAchievements.length > 0 ? 1 : 0);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const renderStepContent = () => {
    // Points earned (always first step)
    if (currentStep === 0) {
      return (
        <motion.div
          key="points"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-primary"
          >
            <PartyPopper size={48} />
          </motion.div>

          <h2 className="text-2xl font-bold text-center">Success!</h2>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-lg mb-2">You earned</p>
            <p className="text-4xl font-bold text-primary">
              {pointsEarned} points
            </p>
          </motion.div>
        </motion.div>
      );
    }

    // Streak increased (second step if applicable)
    if (streakIncreased && currentStep === (streakIncreased ? 1 : 0)) {
      return (
        <motion.div
          key="streak"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-orange-500"
          >
            <Award size={48} />
          </motion.div>

          <h2 className="text-2xl font-bold text-center">Streak Increased!</h2>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-lg mb-2">You're on fire! 🔥</p>
            <p className="text-4xl font-bold text-orange-500">
              {streakIncreased ? "3 Days" : ""}
            </p>
          </motion.div>
        </motion.div>
      );
    }

    // Level up (third step if applicable)
    if (levelUp && currentStep === (streakIncreased ? 2 : 1)) {
      return (
        <motion.div
          key="level"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-blue-500"
          >
            <Trophy size={48} />
          </motion.div>

          <h2 className="text-2xl font-bold text-center">Level Up!</h2>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-lg mb-2">You've reached</p>
            <p className="text-4xl font-bold text-blue-500">
              Level {levelUp ? "6" : ""}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              New rewards unlocked!
            </p>
          </motion.div>
        </motion.div>
      );
    }

    // Achievements (last step if applicable)
    if (newAchievements.length > 0 && currentStep === totalSteps - 1) {
      return (
        <motion.div
          key="achievements"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 0.5, repeat: 3 }}
            className="text-purple-500"
          >
            <Award size={48} />
          </motion.div>

          <h2 className="text-2xl font-bold text-center">
            Achievement Unlocked!
          </h2>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-lg mb-4">Congratulations!</p>
            <div className="bg-purple-50 p-3 rounded-lg w-full">
              <div className="space-y-2">
                {newAchievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2 text-purple-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Award className="h-5 w-5 text-purple-500" />
                    <span>{achievement}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <Confetti active={showConfetti} particleCount={levelUp ? 200 : 150} />
      <Card className="w-[90%] max-w-md p-6 bg-white shadow-lg relative overflow-hidden">
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full ${i === currentStep ? "bg-primary" : "bg-gray-200"}`}
              />
            ))}
          </div>

          <Button onClick={handleNext} className="mt-4" variant="default">
            {currentStep < totalSteps - 1 ? (
              <>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>

        {/* Confetti effect */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            initial={{
              opacity: 1,
              scale: 0,
              x: "50%",
              y: "50%",
            }}
            animate={{
              opacity: 0,
              scale: 1,
              x: `${Math.random() * 200 - 100}%`,
              y: `${Math.random() * 200 - 100}%`,
            }}
            transition={{
              duration: 1,
              delay: i * 0.02,
              repeat: 3,
            }}
            style={{
              background: [
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF00FF",
              ][Math.floor(Math.random() * 5)],
            }}
          />
        ))}
      </Card>
    </motion.div>
  );
};

export default SuccessOverlay;