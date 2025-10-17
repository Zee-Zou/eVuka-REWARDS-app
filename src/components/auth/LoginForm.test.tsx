import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./LoginForm";
import { AuthContext } from "@/lib/auth";
import { BrowserRouter } from "react-router-dom";

// Mock the auth context
const mockSignIn = jest.fn();
const mockAuthContext = {
  user: null,
  loading: false,
  signIn: mockSignIn,
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
};

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <LoginForm />
      </AuthContext.Provider>
    </BrowserRouter>,
  );
};

describe("LoginForm", () => {
  beforeEach(() => {
    mockSignIn.mockClear();
  });

  test("renders login form correctly", () => {
    renderLoginForm();

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test("handles form submission", async () => {
    renderLoginForm();

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Check if signIn was called with correct arguments
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });
  });

  test("shows loading state during submission", async () => {
    // Mock signIn to delay resolution
    mockSignIn.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderLoginForm();

    // Fill and submit form
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // Check for loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });
});
