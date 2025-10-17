import { render, screen, fireEvent } from "@testing-library/react";
import CameraView from "./CameraView";
import { OCRResult } from "@/lib/ocr";
import React from "react";

// Mock navigator.mediaDevices
const mockMediaStream = {};
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
  },
  writable: true,
});

// Mock HTMLVideoElement methods
HTMLVideoElement.prototype.play = jest.fn();

// Mock OCR results for testing
const mockOcrResult: OCRResult = {
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

describe("CameraView", () => {
  const mockOnCapture = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders camera view correctly", () => {
    render(<CameraView onCapture={mockOnCapture} />);

    expect(screen.getByText("Receipt Capture")).toBeInTheDocument();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  test("handles capture button click", () => {
    // Mock canvas and context
    const mockContext = {
      drawImage: jest.fn(),
    };
    const mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext),
      toDataURL: jest
        .fn()
        .mockReturnValue("data:image/jpeg;base64,mockImageData"),
      width: 0,
      height: 0,
    };
    jest
      .spyOn(document, "createElement")
      .mockImplementation(() => mockCanvas as unknown as HTMLCanvasElement);

    // Mock video element
    const mockVideoRef = {
      current: {
        videoWidth: 640,
        videoHeight: 480,
      },
    };
    jest.spyOn(React, "useRef").mockReturnValue(mockVideoRef);

    render(<CameraView onCapture={mockOnCapture} />);

    // Click capture button
    fireEvent.click(screen.getByRole("button", { name: /capture/i }));

    expect(mockContext.drawImage).toHaveBeenCalled();
    expect(mockCanvas.toDataURL).toHaveBeenCalled();
    expect(mockOnCapture).toHaveBeenCalledWith(
      "data:image/jpeg;base64,mockImageData",
    );
  });

  test("displays OCR confidence when provided", () => {
    render(
      <CameraView
        onCapture={mockOnCapture}
        ocrResult={mockOcrResult}
        showOcrConfidence={true}
      />,
    );

    // Check if OCR confidence is displayed
    expect(screen.getByText(/OCR Confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/86%/i)).toBeInTheDocument(); // Rounded from 85.5%
    expect(screen.getByText(/High quality/i)).toBeInTheDocument();
  });

  test("displays low confidence warning for poor OCR results", () => {
    render(
      <CameraView
        onCapture={mockOnCapture}
        ocrResult={mockLowConfidenceOcrResult}
        showOcrConfidence={true}
      />,
    );

    // Check if OCR confidence is displayed with warning
    expect(screen.getByText(/OCR Confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/45%/i)).toBeInTheDocument(); // Rounded from 45.2%
    expect(screen.getByText(/Low quality/i)).toBeInTheDocument();
  });

  test("does not display OCR confidence when showOcrConfidence is false", () => {
    render(
      <CameraView
        onCapture={mockOnCapture}
        ocrResult={mockOcrResult}
        showOcrConfidence={false}
      />,
    );

    // Check that OCR confidence is not displayed
    expect(screen.queryByText(/OCR Confidence/i)).not.toBeInTheDocument();
  });
});
