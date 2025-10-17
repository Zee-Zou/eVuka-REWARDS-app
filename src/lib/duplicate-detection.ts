import { ProcessedReceipt } from "./receipt-processing";
import { logger } from "./logger";

interface ReceiptFingerprint {
  store: string;
  total: number;
  date: string;
  itemCount: number;
  itemsHash: string;
}

/**
 * Creates a unique fingerprint for a receipt to detect duplicates
 */
export const createReceiptFingerprint = (
  receipt: ProcessedReceipt,
): ReceiptFingerprint => {
  // Create a hash of items if available
  const itemsHash = receipt.items
    ? receipt.items
        .map(
          (item) =>
            `${item.name.toLowerCase().trim()}:${item.price.toFixed(2)}`,
        )
        .sort()
        .join("|")
    : "";

  return {
    store: receipt.store.toLowerCase().trim(),
    total: receipt.total,
    date: receipt.date,
    itemCount: receipt.items?.length || 0,
    itemsHash,
  };
};

/**
 * Compares two receipts to determine if they are likely duplicates
 * Returns a score between 0 and 1, where 1 means definitely duplicate
 */
export const compareReceipts = (
  receipt1: ProcessedReceipt,
  receipt2: ProcessedReceipt,
): number => {
  const fp1 = createReceiptFingerprint(receipt1);
  const fp2 = createReceiptFingerprint(receipt2);

  let score = 0;

  // Check total amount (most important factor)
  if (Math.abs(fp1.total - fp2.total) < 0.01) {
    score += 0.5; // Exact match on total is highly suspicious
  } else if (Math.abs(fp1.total - fp2.total) < 1.0) {
    score += 0.3; // Very close totals
  }

  // Check store name
  if (fp1.store === fp2.store) {
    score += 0.2;
  } else if (fp1.store.includes(fp2.store) || fp2.store.includes(fp1.store)) {
    score += 0.1; // Partial store name match
  }

  // Check date (same day)
  try {
    const date1 = new Date(fp1.date);
    const date2 = new Date(fp2.date);
    if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
      if (date1.toDateString() === date2.toDateString()) {
        score += 0.2;
      }
    }
  } catch (error) {
    // Skip date comparison if dates are invalid
  }

  // Check items if available
  if (fp1.itemsHash && fp2.itemsHash && fp1.itemsHash === fp2.itemsHash) {
    score += 0.3; // Exact match on all items
  } else if (fp1.itemCount > 0 && fp2.itemCount > 0) {
    // If item counts are similar, add some score
    const countDiff = Math.abs(fp1.itemCount - fp2.itemCount);
    if (countDiff === 0) {
      score += 0.1;
    } else if (countDiff <= 2) {
      score += 0.05;
    }
  }

  // Cap the score at 1.0
  return Math.min(score, 1.0);
};

/**
 * Checks if a receipt is likely a duplicate of any in the provided history
 * Returns the duplicate score and the matching receipt if found
 */
export const checkForDuplicates = (
  newReceipt: ProcessedReceipt,
  receiptHistory: ProcessedReceipt[],
): {
  isDuplicate: boolean;
  score: number;
  matchingReceipt?: ProcessedReceipt;
} => {
  if (!receiptHistory || receiptHistory.length === 0) {
    return { isDuplicate: false, score: 0 };
  }

  let highestScore = 0;
  let matchingReceipt: ProcessedReceipt | undefined;

  for (const historicalReceipt of receiptHistory) {
    const score = compareReceipts(newReceipt, historicalReceipt);
    if (score > highestScore) {
      highestScore = score;
      matchingReceipt = historicalReceipt;
    }
  }

  // Consider it a duplicate if score is above threshold
  const isDuplicate = highestScore >= 0.7;

  if (isDuplicate) {
    logger.warn("Potential duplicate receipt detected", {
      score: highestScore,
      newReceipt,
      matchingReceipt,
    });
  }

  return {
    isDuplicate,
    score: highestScore,
    matchingReceipt,
  };
};

/**
 * Advanced data extraction from receipt text using pattern matching
 */
export const extractAdvancedData = (
  receiptText: string,
): Record<string, any> => {
  const data: Record<string, any> = {};

  // Extract receipt number/ID
  const receiptIdMatch =
    receiptText.match(
      /(?:receipt|order|transaction)(?:\s+(?:id|no|number|#)):?\s*([\w\d-]+)/i,
    ) || receiptText.match(/(?:receipt|order|transaction)[^\w\d]*(\d{5,})/i);
  if (receiptIdMatch) {
    data.receiptId = receiptIdMatch[1];
  }

  // Extract cashier name
  const cashierMatch = receiptText.match(
    /(?:cashier|associate|served by|operator):?\s*([\w\s]+)/i,
  );
  if (cashierMatch) {
    data.cashier = cashierMatch[1].trim();
  }

  // Extract payment method
  const paymentMethodMatch =
    receiptText.match(
      /(?:paid by|payment method|payment type|tender):?\s*([\w\s]+)/i,
    ) ||
    receiptText.match(/(?:visa|mastercard|amex|cash|credit|debit|card|check)/i);
  if (paymentMethodMatch) {
    data.paymentMethod = paymentMethodMatch[1]
      ? paymentMethodMatch[1].trim()
      : paymentMethodMatch[0];
  }

  // Extract tax information
  const taxMatch = receiptText.match(
    /(?:tax|vat|gst)\s*(?:\(\d+%\))?:?\s*\$?(\d+\.\d{2})/i,
  );
  if (taxMatch) {
    data.tax = parseFloat(taxMatch[1]);
  }

  // Extract subtotal
  const subtotalMatch = receiptText.match(
    /(?:subtotal|sub-total|sub total):?\s*\$?(\d+\.\d{2})/i,
  );
  if (subtotalMatch) {
    data.subtotal = parseFloat(subtotalMatch[1]);
  }

  // Extract discount information
  const discountMatch = receiptText.match(
    /(?:discount|savings|coupon)\s*(?:\(\d+%\))?:?\s*\$?(\d+\.\d{2})/i,
  );
  if (discountMatch) {
    data.discount = parseFloat(discountMatch[1]);
  }

  // Extract loyalty program information
  const loyaltyMatch =
    receiptText.match(
      /(?:loyalty|rewards|points|club card)\s*(?:number|#|id)?:?\s*([\w\d]+)/i,
    ) || receiptText.match(/(?:earned|received)\s*(\d+)\s*(?:points|rewards)/i);
  if (loyaltyMatch) {
    data.loyalty = loyaltyMatch[1].trim();
  }

  return data;
};
