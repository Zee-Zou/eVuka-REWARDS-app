import { supabase } from "./supabase";
import { Receipt, PointsTransaction } from "./database.types";
import { assertResponse } from "./error-handler";
import { StorageError } from "@/types/errors";

export const saveReceipt = async (
  receipt: Omit<Receipt, "id" | "created_at" | "category" | "fraud_score">,
): Promise<Receipt> => {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .insert({
        ...receipt,
        category: "receipt", // Default category
        fraud_score: 0, // Default fraud score
      })
      .select()
      .single();

    return assertResponse<Receipt>({
      data,
      error,
    });
  } catch (error) {
    throw new StorageError(
      `Failed to save receipt: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const savePointsTransaction = async (
  transaction: Omit<PointsTransaction, "id" | "created_at">,
): Promise<PointsTransaction> => {
  try {
    const { data, error } = await supabase
      .from("points_transactions")
      .insert(transaction)
      .select()
      .single();

    return assertResponse<PointsTransaction>({
      data,
      error,
    });
  } catch (error) {
    throw new StorageError(
      `Failed to save points transaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

export const getPointsHistory = async (
  userId: string,
): Promise<PointsTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from("points_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return assertResponse<PointsTransaction[]>({
      data,
      error,
    });
  } catch (error) {
    throw new StorageError(
      `Failed to fetch points history: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
