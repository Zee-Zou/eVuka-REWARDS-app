import { EmailVerification } from "@/components/auth/EmailVerification";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";

const VerifyEmailPage = () => {
  return (
    <AnimatedGradientBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">eVuka Rewards</h1>
          <p className="text-muted-foreground mt-2">
            Verify your email to continue
          </p>
        </div>
        <EmailVerification />
      </div>
    </AnimatedGradientBackground>
  );
};

export default VerifyEmailPage;
