import { supabase } from "./supabase";

interface UserPoints {
  userId: string;
  points: number;
  level: number;
  streakDays: number;
  lastActivity: string;
  weeklyTotal: number;
  multiplier: number;
}

export interface RewardRecommendation {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  relevance_score: number;
  category: string;
  image_url?: string;
}

export const calculateLevel = (points: number): number => {
  // Level formula: Each level requires more points than the previous
  if (points < 100) return 1;
  if (points < 250) return 2;
  if (points < 500) return 3;
  if (points < 1000) return 4;
  if (points < 2000) return 5;
  if (points < 3500) return 6;
  if (points < 5000) return 7;
  if (points < 7500) return 8;
  if (points < 10000) return 9;
  return 10 + Math.floor((points - 10000) / 2500);
};

export const calculateMultiplier = (
  streakDays: number,
  level: number,
): number => {
  // Base multiplier
  let multiplier = 1.0;

  // Streak bonus (max +0.5)
  if (streakDays >= 30) multiplier += 0.5;
  else if (streakDays >= 14) multiplier += 0.3;
  else if (streakDays >= 7) multiplier += 0.2;
  else if (streakDays >= 3) multiplier += 0.1;

  // Level bonus (max +0.5)
  if (level >= 10) multiplier += 0.5;
  else if (level >= 7) multiplier += 0.3;
  else if (level >= 5) multiplier += 0.2;
  else if (level >= 3) multiplier += 0.1;

  return parseFloat(multiplier.toFixed(1));
};

export const calculatePointsForReceipt = (
  receiptTotal: number,
  multiplier: number,
  isFirstOfDay: boolean,
  isSpecialPromotion: boolean,
): number => {
  // Base points calculation
  let points = Math.floor(receiptTotal * 10); // $1 = 10 points

  // Apply multiplier
  points = Math.floor(points * multiplier);

  // First receipt of the day bonus
  if (isFirstOfDay) points += 50;

  // Special promotion bonus
  if (isSpecialPromotion) points *= 2;

  return points;
};

export const updateUserStreak = async (userId: string): Promise<number> => {
  try {
    // Get user's current streak info
    const { data: userData, error } = await supabase
      .from("user_stats")
      .select("streak_days, last_activity")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    if (!userData) {
      // Create new user stats if not exists
      const { data: newUser, error: createError } = await supabase
        .from("user_stats")
        .insert({
          user_id: userId,
          streak_days: 1,
          last_activity: new Date().toISOString(),
          points: 0,
          level: 1,
        })
        .select()
        .single();

      if (createError) throw createError;
      return 1; // New streak
    }

    // Check if last activity was yesterday or today
    const lastActivity = new Date(userData.last_activity);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset dates to start of day for comparison
    lastActivity.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    let newStreak = userData.streak_days;

    if (lastActivity.getTime() === yesterday.getTime()) {
      // Continuing streak
      newStreak += 1;
    } else if (lastActivity.getTime() < yesterday.getTime()) {
      // Streak broken
      newStreak = 1;
    }
    // If lastActivity is today, streak remains the same

    // Update streak
    const { error: updateError } = await supabase
      .from("user_stats")
      .update({
        streak_days: newStreak,
        last_activity: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    return newStreak;
  } catch (error) {
    // Error updating streak
    return 0;
  }
};

export const awardAchievement = async (
  userId: string,
  achievementId: string,
): Promise<boolean> => {
  try {
    // Check if user already has this achievement
    const { data: existingAchievement, error: checkError } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected
      throw checkError;
    }

    // If achievement already exists, don't add it again
    if (existingAchievement) return false;

    // Award the achievement
    const { error: insertError } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        awarded_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    return true;
  } catch (error) {
    // Error awarding achievement
    return false;
  }
};

export const checkForAchievements = async (
  userId: string,
  stats: UserPoints,
): Promise<string[]> => {
  const newAchievements: string[] = [];

  // Check level-based achievements
  if (stats.level >= 5) {
    const awarded = await awardAchievement(userId, "level-5");
    if (awarded) newAchievements.push("level-5");
  }

  if (stats.level >= 10) {
    const awarded = await awardAchievement(userId, "level-10");
    if (awarded) newAchievements.push("level-10");
  }

  // Check streak-based achievements
  if (stats.streakDays >= 7) {
    const awarded = await awardAchievement(userId, "streak-7");
    if (awarded) newAchievements.push("streak-7");
  }

  if (stats.streakDays >= 30) {
    const awarded = await awardAchievement(userId, "streak-30");
    if (awarded) newAchievements.push("streak-30");
  }

  // Check points-based achievements
  if (stats.points >= 10000) {
    const awarded = await awardAchievement(userId, "points-10k");
    if (awarded) newAchievements.push("points-10k");
  }

  return newAchievements;
};

/**
 * Get personalized reward recommendations based on user's scanning history
 * @param userId The user's ID
 * @param limit Maximum number of recommendations to return
 * @returns Array of recommended rewards
 */
export const getRewardRecommendations = async (
  userId: string,
  limit: number = 3,
): Promise<RewardRecommendation[]> => {
  try {
    // Step 1: Get user's receipt history to analyze preferences
    const { data: receipts, error: receiptsError } = await supabase
      .from("receipts")
      .select("store, category, total")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (receiptsError) throw receiptsError;

    // Step 2: Analyze user's spending patterns
    const categoryFrequency: Record<string, number> = {};
    const storeFrequency: Record<string, number> = {};
    let totalSpent = 0;

    receipts?.forEach((receipt) => {
      // Track category frequency
      if (receipt.category) {
        categoryFrequency[receipt.category] =
          (categoryFrequency[receipt.category] || 0) + 1;
      }

      // Track store frequency
      if (receipt.store) {
        storeFrequency[receipt.store] =
          (storeFrequency[receipt.store] || 0) + 1;
      }

      // Track total spending
      totalSpent += receipt.total || 0;
    });

    // Get top categories and stores
    const topCategories = Object.entries(categoryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    const topStores = Object.entries(storeFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    // Step 3: Get available rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from("rewards")
      .select("*")
      .limit(50);

    if (rewardsError) throw rewardsError;

    // Step 4: Score and rank rewards based on user preferences
    const scoredRewards =
      rewards?.map((reward) => {
        let relevanceScore = 0;

        // Boost score if reward category matches user's top categories
        if (topCategories.includes(reward.category)) {
          relevanceScore += 30;
        }

        // Boost score if reward is from user's favorite stores
        if (
          reward.title
            .toLowerCase()
            .includes(
              topStores.find((store) =>
                reward.title.toLowerCase().includes(store.toLowerCase()),
              ) || "",
            )
        ) {
          relevanceScore += 25;
        }

        // Adjust score based on points cost relative to user's spending
        const avgSpending = totalSpent / (receipts?.length || 1);
        if (reward.points_cost <= avgSpending * 10) {
          relevanceScore += 15;
        }

        // Add some randomness to avoid always showing the same recommendations
        relevanceScore += Math.random() * 10;

        return {
          ...reward,
          relevance_score: relevanceScore,
        };
      }) || [];

    // Sort by relevance score and return top recommendations
    return scoredRewards
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
  } catch (error) {
    // Error getting reward recommendations
    return [];
  }
};