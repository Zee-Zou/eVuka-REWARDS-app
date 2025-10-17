import { ReceiptAnalysis } from "./database.types";

// Mock implementation that doesn't require OpenAI API key
export const analyzeReceipt = async (
  imageData: string,
): Promise<ReceiptAnalysis> => {
  // Return mock data since we don't have an OpenAI API key
  return {
    id: crypto.randomUUID(),
    receipt_id: crypto.randomUUID(),
    items: [
      { name: "Milk", price: 3.99, category: "Groceries" },
      { name: "Bread", price: 2.49, category: "Groceries" },
      { name: "Eggs", price: 4.99, category: "Groceries" },
      { name: "Paper Towels", price: 5.99, category: "Household" },
    ],
    total: 17.46,
    store: "Sample Grocery Store",
    date: new Date().toISOString(),
    confidence_score: 0.95,
  };
};

// Mock implementation for fraud detection
export const detectFraud = async (
  receiptData: ReceiptAnalysis,
): Promise<number> => {
  // Return a low fraud score for all receipts
  return 0.1;
};

// Simple categorization function
function categorizeItem(itemName: string): string {
  const categories = [
    {
      name: "Groceries",
      keywords: ["milk", "bread", "egg", "cheese", "fruit", "vegetable"],
    },
    {
      name: "Electronics",
      keywords: ["phone", "charger", "cable", "battery", "computer"],
    },
    {
      name: "Household",
      keywords: ["soap", "detergent", "cleaner", "paper", "towel"],
    },
    { name: "Clothing", keywords: ["shirt", "pant", "sock", "shoe", "jacket"] },
  ];

  const lowerName = itemName.toLowerCase();
  for (const category of categories) {
    if (category.keywords.some((keyword) => lowerName.includes(keyword))) {
      return category.name;
    }
  }
  return "Other";
}