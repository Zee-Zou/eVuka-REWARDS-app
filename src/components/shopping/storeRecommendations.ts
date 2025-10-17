interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
}

interface StoreRecommendation {
  store: string;
  totalPrice: number;
  savings: number;
  items: {
    name: string;
    price: number;
    onSale: boolean;
    discount?: number;
  }[];
}

// Mock data for store pricing
const storePricing: Record<string, Record<string, number>> = {
  Walmart: {
    apple: 0.89,
    banana: 0.59,
    milk: 3.49,
    bread: 2.29,
    eggs: 3.99,
    chicken: 7.99,
    rice: 4.99,
    pasta: 1.49,
    cereal: 3.99,
    cheese: 4.99,
    yogurt: 1.29,
    coffee: 8.99,
    "toilet paper": 12.99,
    "paper towels": 9.99,
    detergent: 11.99,
    shampoo: 4.99,
    toothpaste: 3.49,
    soap: 2.99,
    water: 4.99,
    soda: 5.99,
    juice: 3.99,
    chips: 3.49,
    cookies: 3.99,
    "ice cream": 4.99,
    "frozen pizza": 5.99,
  },
  Target: {
    apple: 0.99,
    banana: 0.69,
    milk: 3.79,
    bread: 2.49,
    eggs: 4.29,
    chicken: 8.49,
    rice: 5.29,
    pasta: 1.79,
    cereal: 4.29,
    cheese: 5.29,
    yogurt: 1.49,
    coffee: 9.49,
    "toilet paper": 13.49,
    "paper towels": 10.49,
    detergent: 12.49,
    shampoo: 5.29,
    toothpaste: 3.79,
    soap: 3.29,
    water: 5.29,
    soda: 6.29,
    juice: 4.29,
    chips: 3.79,
    cookies: 4.29,
    "ice cream": 5.29,
    "frozen pizza": 6.29,
  },
  Kroger: {
    apple: 0.95,
    banana: 0.65,
    milk: 3.59,
    bread: 2.39,
    eggs: 4.19,
    chicken: 8.29,
    rice: 5.19,
    pasta: 1.69,
    cereal: 4.19,
    cheese: 5.19,
    yogurt: 1.39,
    coffee: 9.29,
    "toilet paper": 13.29,
    "paper towels": 10.29,
    detergent: 12.29,
    shampoo: 5.19,
    toothpaste: 3.69,
    soap: 3.19,
    water: 5.19,
    soda: 6.19,
    juice: 4.19,
    chips: 3.69,
    cookies: 4.19,
    "ice cream": 5.19,
    "frozen pizza": 6.19,
  },
  Costco: {
    apple: 0.85,
    banana: 0.55,
    milk: 3.29,
    bread: 2.19,
    eggs: 3.89,
    chicken: 7.89,
    rice: 4.89,
    pasta: 1.39,
    cereal: 3.89,
    cheese: 4.89,
    yogurt: 1.19,
    coffee: 8.89,
    "toilet paper": 12.89,
    "paper towels": 9.89,
    detergent: 11.89,
    shampoo: 4.89,
    toothpaste: 3.39,
    soap: 2.89,
    water: 4.89,
    soda: 5.89,
    juice: 3.89,
    chips: 3.39,
    cookies: 3.89,
    "ice cream": 4.89,
    "frozen pizza": 5.89,
  },
  "Whole Foods": {
    apple: 1.29,
    banana: 0.79,
    milk: 4.29,
    bread: 3.49,
    eggs: 5.29,
    chicken: 9.99,
    rice: 6.29,
    pasta: 2.49,
    cereal: 5.29,
    cheese: 6.29,
    yogurt: 1.99,
    coffee: 11.99,
    "toilet paper": 14.99,
    "paper towels": 11.99,
    detergent: 13.99,
    shampoo: 6.29,
    toothpaste: 4.49,
    soap: 3.99,
    water: 5.99,
    soda: 6.99,
    juice: 5.29,
    chips: 4.49,
    cookies: 5.29,
    "ice cream": 6.29,
    "frozen pizza": 7.99,
  },
};

// Mock data for current sales/discounts
const currentSales: Record<string, Record<string, number>> = {
  Walmart: {
    milk: 10,
    bread: 15,
    eggs: 20,
    cereal: 25,
    "toilet paper": 15,
    soda: 20,
  },
  Target: {
    apple: 15,
    banana: 10,
    chicken: 20,
    pasta: 25,
    detergent: 15,
    chips: 20,
  },
  Kroger: {
    cheese: 15,
    yogurt: 10,
    coffee: 20,
    "paper towels": 25,
    toothpaste: 15,
    cookies: 20,
  },
  Costco: {
    rice: 15,
    pasta: 10,
    cereal: 20,
    shampoo: 25,
    soap: 15,
    juice: 20,
  },
  "Whole Foods": {
    apple: 20,
    milk: 15,
    bread: 10,
    eggs: 15,
    chicken: 20,
    "ice cream": 25,
  },
};

// Function to find the best matching product in our database
const findMatchingProduct = (itemName: string): string | null => {
  const lowerName = itemName.toLowerCase();

  // Direct match
  if (storePricing.Walmart[lowerName]) {
    return lowerName;
  }

  // Partial match - prioritize longer matches first for better accuracy
  const products = Object.keys(storePricing.Walmart).sort(
    (a, b) => b.length - a.length,
  );

  // First try exact word matches (with word boundaries)
  for (const product of products) {
    const productWords = product.split(/\s+/);
    const itemWords = lowerName.split(/\s+/);

    // Check if any product word exactly matches any item word
    if (productWords.some((pWord) => itemWords.includes(pWord))) {
      return product;
    }
  }

  // Then try substring matches
  for (const product of products) {
    if (lowerName.includes(product) || product.includes(lowerName)) {
      return product;
    }
  }

  return null;
};

// Generate store recommendations based on shopping list
export const generateMockStoreRecommendations = (
  items: ShoppingItem[],
): StoreRecommendation[] => {
  const stores = Object.keys(storePricing);
  const recommendations: StoreRecommendation[] = [];

  // Only consider active (not completed) items
  const activeItems = items.filter((item) => !item.completed);

  if (activeItems.length === 0) {
    return [];
  }

  // Calculate total price for each store
  for (const store of stores) {
    const storeItems: StoreRecommendation["items"] = [];
    let totalPrice = 0;
    let totalRegularPrice = 0;

    for (const item of activeItems) {
      const matchedProduct = findMatchingProduct(item.name);

      if (matchedProduct) {
        const basePrice = storePricing[store][matchedProduct];
        const discount = currentSales[store][matchedProduct] || 0;
        const discountedPrice = basePrice * (1 - discount / 100);

        // Multiply by quantity
        const itemTotalPrice = discountedPrice * item.quantity;
        const itemRegularPrice = basePrice * item.quantity;

        totalPrice += itemTotalPrice;
        totalRegularPrice += itemRegularPrice;

        storeItems.push({
          name: item.name,
          price: discountedPrice,
          onSale: discount > 0,
          discount: discount > 0 ? discount : undefined,
        });
      } else {
        // If we don't have pricing data, use a random price
        const randomPrice = (Math.random() * 5 + 2).toFixed(2);
        totalPrice += parseFloat(randomPrice) * item.quantity;
        totalRegularPrice += parseFloat(randomPrice) * item.quantity;

        storeItems.push({
          name: item.name,
          price: parseFloat(randomPrice),
          onSale: false,
        });
      }
    }

    recommendations.push({
      store,
      totalPrice,
      savings: totalRegularPrice - totalPrice,
      items: storeItems,
    });
  }

  // Sort by total price (lowest first)
  return recommendations.sort((a, b) => a.totalPrice - b.totalPrice);
};
