import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import CaptureInterface from "./CaptureInterface";
import { OCRResult, OCRErrorType } from "@/lib/ocr";
import React from "react";
import { ProcessedReceipt } from "@/lib/receipt-processing";
import { ProcessingError } from "@/types/errors";

// Mock the supabase client
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
    },
  },
}));

// Mock the offline storage
jest.mock("@/lib/offline-storage", () => ({
  offlineStorage: {
    getPendingReceipts: jest.fn().mockResolvedValue([]),
    saveReceipt: jest.fn().mockResolvedValue("test-receipt-id"),
    removeReceipt: jest.fn().mockResolvedValue(true),
  },
}));

// Mock the gamification library
jest.mock("@/lib/gamification", () => ({
  getRewardRecommendations: jest.fn().mockResolvedValue([
    {
      id: "reward-1",
      title: "Test Reward",
      description: "Test reward description",
      points_cost: 100,
      image_url: "https://example.com/image.jpg",
    },
  ]),
}));

// Mock the logger
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the utils library for useLocalStorage hook
jest.mock("@/lib/utils", () => ({
  useLocalStorage: jest.fn().mockImplementation((key, initialValue) => {
    // Return different values based on the key
    if (key === "enableOCR") return [true];
    if (key === "highQualityCapture") return [true];
    return [initialValue];
  }),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

// Mock OCR results for testing
const mockHighConfidenceOcrResult: OCRResult = {
  text: "Test Receipt\nStore: Test Store\nItem 1 $10.99\nItem 2 $5.99\nTotal: $16.98",
  confidence: 85.5,
  items: [
    { name: "Item 1", price: 10.99 },
    { name: "Item 2", price: 5.99 },
  ],
  total: 16.98,
  date: "2023-07-15",
  store: "Test Store",
  processingTime: 1250,
  imageQuality: "high",
};

const mockMediumConfidenceOcrResult: OCRResult = {
  text: "Test Receipt\nStore: Test Store\nItem 1 $10.99\nItem 2 $5.99\nTotal: $16.98",
  confidence: 65.3,
  items: [
    { name: "Item 1", price: 10.99 },
    { name: "Item 2", price: 5.99 },
  ],
  total: 16.98,
  date: "2023-07-15",
  store: "Test Store",
  processingTime: 1350,
  imageQuality: "medium",
};

const mockLowConfidenceOcrResult: OCRResult = {
  text: "Test Receipt\nStore: Test Store\nItem 1 $10.99\nItem 2 $5.99\nTotal: $16.98",
  confidence: 45.2,
  items: [
    { name: "Item 1", price: 10.99 },
    { name: "Item 2", price: 5.99 },
  ],
  total: 16.98,
  date: "2023-07-15",
  store: "Test Store",
  processingTime: 1500,
  imageQuality: "low",
  errorDetails:
    "Low confidence in text recognition. Results may be inaccurate.",
};

// Mock processed receipt data
const mockProcessedReceipt: ProcessedReceipt = {
  text: "Test Receipt\nStore: Test Store\nItem 1 $10.99\nItem 2 $5.99\nTotal: $16.98",
  total: 16.98,
  date: "2023-07-15",
  store: "Test Store",
  items: [
    { name: "Test Item 1", price: 10.99, category: "Grocery" },
    { name: "Test Item 2", price: 5.99, category: "Household" },
  ],
  fraudScore: 0.1,
  advancedData: { storeId: "ST123", cashierId: "C456" },
  isDuplicate: false,
  duplicateScore: 0.05,
  detectedProducts: [
    { name: "Test Product 1", price: 10.99 },
    { name: "Test Product 2", price: 5.99 },
  ],
};

// Mock OCR errors
const mockOcrTimeoutError = new ProcessingError(
  "OCR processing timed out. Try with a clearer image or smaller receipt.",
  OCRErrorType.TIMEOUT,
);

const mockOcrInvalidImageError = new ProcessingError(
  "Invalid image data provided",
  OCRErrorType.INVALID_IMAGE,
);

describe("CaptureInterface", () => {
  const mockOnCapture = jest.fn().mockResolvedValue(50);
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the global window object with the last processed receipt
    // This is used by the component to get OCR results
    window._lastProcessedReceipt = undefined;
    // Reset online status
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
  });

  test("renders capture interface correctly", () => {
    render(
      <CaptureInterface
        onCapture={mockOnCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    expect(screen.getByText("Capture Receipt")).toBeInTheDocument();
    expect(
      screen.getByText(/Scan your receipt to earn points/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("QR Code")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
    expect(screen.getByText("Email / Accounts")).toBeInTheDocument();
    expect(screen.getByText("AR Scanner")).toBeInTheDocument();
  });

  test("handles camera capture method selection", () => {
    render(
      <CaptureInterface
        onCapture={mockOnCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Click on the camera button
    fireEvent.click(screen.getByText("Camera"));

    // Check if camera view is displayed
    expect(screen.getByText("Camera Capture")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("handles upload capture method selection", () => {
    render(
      <CaptureInterface
        onCapture={mockOnCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Click on the upload button
    fireEvent.click(screen.getByText("Upload"));

    // Check if upload view is displayed
    expect(screen.getByText("Upload Receipt")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("successfully processes receipt with high confidence OCR", async () => {
    // Mock the onCapture function to simulate successful OCR processing
    const mockSuccessCapture = jest.fn().mockImplementation(async () => {
      // Set the processed receipt in the global window object
      window._lastProcessedReceipt = {
        ...mockProcessedReceipt,
        ocrConfidence: mockHighConfidenceOcrResult.confidence,
        imageQuality: mockHighConfidenceOcrResult.imageQuality,
      };
      return 75; // Return points earned
    });

    render(
      <CaptureInterface
        onCapture={mockSuccessCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Select camera capture method
    fireEvent.click(screen.getByText("Camera"));

    // Mock image capture
    const mockImageData = "data:image/jpeg;base64,mockImageData";

    // Find the CameraView component and simulate capture
    await act(async () => {
      // Get the onCapture prop from CameraView and call it
      const captureButton = screen.getByRole("button", { name: /capture/i });
      fireEvent.click(captureButton);

      // Manually trigger the handleImageCapture function with mock image data
      await mockSuccessCapture(mockImageData);
    });

    // Wait for processing to complete and success overlay to appear
    await waitFor(() => {
      expect(mockSuccessCapture).toHaveBeenCalledWith(mockImageData, {
        highQuality: true,
      });
    });

    // Verify that the success state is shown with appropriate points
    expect(mockOnSuccess).toHaveBeenCalledWith(75);
  });

  test("successfully processes receipt with medium confidence OCR", async () => {
    // Mock the onCapture function to simulate medium confidence OCR processing
    const mockMediumConfidenceCapture = jest
      .fn()
      .mockImplementation(async () => {
        // Set the processed receipt in the global window object
        window._lastProcessedReceipt = {
          ...mockProcessedReceipt,
          ocrConfidence: mockMediumConfidenceOcrResult.confidence,
          imageQuality: mockMediumConfidenceOcrResult.imageQuality,
        };
        return 50; // Return points earned (less than high confidence)
      });

    render(
      <CaptureInterface
        onCapture={mockMediumConfidenceCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Select camera capture method
    fireEvent.click(screen.getByText("Camera"));

    // Mock image capture
    const mockImageData = "data:image/jpeg;base64,mockImageData";

    // Find the CameraView component and simulate capture
    await act(async () => {
      const captureButton = screen.getByRole("button", { name: /capture/i });
      fireEvent.click(captureButton);

      // Manually trigger the handleImageCapture function with mock image data
      await mockMediumConfidenceCapture(mockImageData);
    });

    // Wait for processing to complete and success overlay to appear
    await waitFor(() => {
      expect(mockMediumConfidenceCapture).toHaveBeenCalledWith(mockImageData, {
        highQuality: true,
      });
    });

    // Verify that the success state is shown with appropriate points
    expect(mockOnSuccess).toHaveBeenCalledWith(50);
  });

  test("successfully processes receipt with low confidence OCR but shows warning", async () => {
    // Mock the onCapture function to simulate low confidence OCR processing
    const mockLowConfidenceCapture = jest.fn().mockImplementation(async () => {
      // Set the processed receipt in the global window object
      window._lastProcessedReceipt = {
        ...mockProcessedReceipt,
        ocrConfidence: mockLowConfidenceOcrResult.confidence,
        imageQuality: mockLowConfidenceOcrResult.imageQuality,
        errorDetails: mockLowConfidenceOcrResult.errorDetails,
      };
      return 25; // Return points earned (less than medium confidence)
    });

    render(
      <CaptureInterface
        onCapture={mockLowConfidenceCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Select camera capture method
    fireEvent.click(screen.getByText("Camera"));

    // Mock image capture
    const mockImageData = "data:image/jpeg;base64,mockImageData";

    // Find the CameraView component and simulate capture
    await act(async () => {
      const captureButton = screen.getByRole("button", { name: /capture/i });
      fireEvent.click(captureButton);

      // Manually trigger the handleImageCapture function with mock image data
      await mockLowConfidenceCapture(mockImageData);
    });

    // Wait for processing to complete
    await waitFor(() => {
      expect(mockLowConfidenceCapture).toHaveBeenCalledWith(mockImageData, {
        highQuality: true,
      });
    });

    // Verify that the success state is shown with appropriate points
    expect(mockOnSuccess).toHaveBeenCalledWith(25);

    // Check for warning message about low confidence
    // Note: This assumes the component shows a warning for low confidence results
    // If the actual implementation doesn't show a warning, this test might need adjustment
    expect(screen.queryByText(/low quality/i)).toBeInTheDocument();
  });

  test("handles OCR timeout error gracefully", async () => {
    // Mock the onCapture function to simulate OCR timeout error
    const mockTimeoutCapture = jest.fn().mockRejectedValue(mockOcrTimeoutError);

    render(
      <CaptureInterface
        onCapture={mockTimeoutCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Select camera capture method
    fireEvent.click(screen.getByText("Camera"));

    // Mock image capture
    const mockImageData = "data:image/jpeg;base64,mockImageData";

    // Find the CameraView component and simulate capture
    await act(async () => {
      try {
        const captureButton = screen.getByRole("button", { name: /capture/i });
        fireEvent.click(captureButton);

        // Manually trigger the handleImageCapture function with mock image data
        await mockTimeoutCapture(mockImageData);
      } catch (error) {
        // Expected error, do nothing
      }
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(mockTimeoutCapture).toHaveBeenCalledWith(mockImageData, {
        highQuality: true,
      });
    });

    // Verify that the error message is displayed
    expect(screen.queryByText(/OCR processing timed out/i)).toBeInTheDocument();

    // Verify that success callback was not called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  test("handles invalid image error gracefully", async () => {
    // Mock the onCapture function to simulate invalid image error
    const mockInvalidImageCapture = jest
      .fn()
      .mockRejectedValue(mockOcrInvalidImageError);

    render(
      <CaptureInterface
        onCapture={mockInvalidImageCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Select camera capture method
    fireEvent.click(screen.getByText("Camera"));

    // Mock image capture
    const mockImageData = "data:image/jpeg;base64,mockImageData";

    // Find the CameraView component and simulate capture
    await act(async () => {
      try {
        const captureButton = screen.getByRole("button", { name: /capture/i });
        fireEvent.click(captureButton);

        // Manually trigger the handleImageCapture function with mock image data
        await mockInvalidImageCapture(mockImageData);
      } catch (error) {
        // Expected error, do nothing
      }
    });

    // Wait for error message to appear
    await waitFor(() => {
      expect(mockInvalidImageCapture).toHaveBeenCalledWith(mockImageData, {
        highQuality: true,
      });
    });

    // Verify that the error message is displayed
    expect(screen.queryByText(/Invalid image data/i)).toBeInTheDocument();

    // Verify that success callback was not called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  test("handles offline mode correctly", async () => {
    // Set navigator.onLine to false to simulate offline mode
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
    });

    // Mock the offlineStorage.saveReceipt function
    const { offlineStorage } = require("@/lib/offline-storage");
    offlineStorage.saveReceipt.mockClear();

    // Mock the onCapture function to simulate successful capture in offline mode
    const mockOfflineCapture = jest.fn().mockImplementation(async () => {
      // In offline mode, the receipt should be saved to offline storage
      return 0; // No points earned immediately in offline mode
    });

    render(
      <CaptureInterface
        onCapture={mockOfflineCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Verify that offline indicator is displayed
    expect(screen.getByText(/offline/i)).toBeInTheDocument();

    // Select camera capture method
    fireEvent.click(screen.getByText("Camera"));

    // Mock image capture
    const mockImageData = "data:image/jpeg;base64,mockImageData";

    // Find the CameraView component and simulate capture
    await act(async () => {
      const captureButton = screen.getByRole("button", { name: /capture/i });
      fireEvent.click(captureButton);

      // Manually trigger the handleImageCapture function with mock image data
      await mockOfflineCapture(mockImageData);
    });

    // Wait for offline storage to be called
    await waitFor(() => {
      expect(offlineStorage.saveReceipt).toHaveBeenCalled();
    });

    // Verify that the offline success message is displayed
    expect(screen.getByText(/offline capture/i)).toBeInTheDocument();

    // Verify that success callback was not called with points
    // (since points are awarded only when online)
    expect(mockOnSuccess).not.toHaveBeenCalled();

    // Reset navigator.onLine for other tests
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
  });

  test("processes pending receipts when coming back online", async () => {
    // First set offline to create pending receipts
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
    });

    // Mock the offlineStorage functions
    const { offlineStorage } = require("@/lib/offline-storage");
    offlineStorage.getPendingReceipts.mockClear();
    offlineStorage.removeReceipt.mockClear();

    // Mock pending receipts
    const mockPendingReceipts = [
      {
        id: "offline-receipt-1",
        imageData: "data:image/jpeg;base64,mockImageData1",
        timestamp: Date.now() - 3600000,
        captureMethod: "camera",
      },
      {
        id: "offline-receipt-2",
        imageData: "data:image/jpeg;base64,mockImageData2",
        timestamp: Date.now() - 7200000,
        captureMethod: "upload",
      },
    ];
    offlineStorage.getPendingReceipts.mockResolvedValue(mockPendingReceipts);

    // Mock the onCapture function to process pending receipts
    const mockProcessPendingCapture = jest
      .fn()
      .mockResolvedValueOnce(25) // First receipt earns 25 points
      .mockResolvedValueOnce(30); // Second receipt earns 30 points

    // Render component in offline mode
    const { rerender } = render(
      <CaptureInterface
        onCapture={mockProcessPendingCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Now simulate coming back online
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });

    // Re-render to trigger online processing
    rerender(
      <CaptureInterface
        onCapture={mockProcessPendingCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Wait for pending receipts to be processed
    await waitFor(() => {
      expect(offlineStorage.getPendingReceipts).toHaveBeenCalled();
      expect(mockProcessPendingCapture).toHaveBeenCalledTimes(2);
      expect(offlineStorage.removeReceipt).toHaveBeenCalledTimes(2);
    });

    // Verify that success callback was called for each receipt
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  test("displays detected products from OCR and allows verification", async () => {
    // Mock the onCapture function to simulate successful OCR with product detection
    const mockProductDetectionCapture = jest
      .fn()
      .mockImplementation(async () => {
        // Set the processed receipt with detected products in the global window object
        window._lastProcessedReceipt = {
          ...mockProcessedReceipt,
          detectedProducts: [
            { name: "Milk", price: 3.99 },
            { name: "Bread", price: 2.49 },
            { name: "Eggs", price: 4.29 },
          ],
        };
        return 50; // Return points earned
      });

    render(
      <CaptureInterface
        onCapture={mockProductDetectionCapture}
        onSuccess={mockOnSuccess}
        enableOCR={true}
      />,
    );

    // Select camera capture method
    fireEvent.click(screen.getByText("Camera"));

    // Mock image capture
    const mockImageData = "data:image/jpeg;base64,mockImageData";

    // Find the CameraView component and simulate capture
    await act(async () => {
      const captureButton = screen.getByRole("button", { name: /capture/i });
      fireEvent.click(captureButton);

      // Manually trigger the handleImageCapture function with mock image data
      await mockProductDetectionCapture(mockImageData);
    });

    // Wait for processing to complete and product verification UI to appear
    await waitFor(() => {
      expect(screen.getByText("Detected Products")).toBeInTheDocument();
    });

    // Check if products are displayed
    expect(screen.getByText("Milk")).toBeInTheDocument();
    expect(screen.getByText("$3.99")).toBeInTheDocument();
    expect(screen.getByText("Bread")).toBeInTheDocument();
    expect(screen.getByText("$2.49")).toBeInTheDocument();
    expect(screen.getByText("Eggs")).toBeInTheDocument();
    expect(screen.getByText("$4.29")).toBeInTheDocument();

    // Click "Verify All" button
    fireEvent.click(screen.getByRole("button", { name: /verify all/i }));

    // Click "Continue" button to proceed
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    // Check if success overlay is shown
    await waitFor(() => {
      expect(screen.getByText(/points earned/i)).toBeInTheDocument();
    });
  });
});
