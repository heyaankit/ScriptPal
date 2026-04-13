"use client";

import React, { useState } from "react";
import { useAuth, isApiError } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Heart, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { COUNTRY_CODES } from "@/lib/enums";

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <Heart className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">ScriptPal</h1>
          <p className="mt-1 text-muted-foreground">
            Your autism support companion
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-xl shadow-black/5">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "register")}
          >
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-4">
              <TabsContent value="login" className="mt-0">
                <AuthForm mode="login" onSwitchTab={() => setActiveTab("login")} />
              </TabsContent>
              <TabsContent value="register" className="mt-0">
                <AuthForm mode="register" onSwitchTab={() => setActiveTab("login")} />
              </TabsContent>
            </CardContent>
          </Tabs>

          <CardFooter className="justify-center border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

interface AuthFormProps {
  mode: "login" | "register";
  onSwitchTab?: () => void;
}

function AuthForm({ mode, onSwitchTab }: AuthFormProps) {
  const {
    requestLoginOtp,
    requestRegisterOtp,
    login,
    register,
  } = useAuth();

  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 6) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await requestLoginOtp(countryCode, phone);
      } else {
        await requestRegisterOtp(countryCode, phone);
      }
      setOtpSent(true);
      toast.success("OTP sent to your phone!");
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(countryCode, phone, otp);
        toast.success("Welcome back!");
      } else {
        await register(countryCode, phone, otp, name || undefined, email || undefined);
        toast.success("Account created successfully!");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "REGISTERED_NEEDS_LOGIN") {
        toast.success("Account created! Check for new OTP and sign in.");
        setOtpSent(false);
        setOtp("");
        onSwitchTab?.();
      } else if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <>
          {/* Phone Input */}
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <div className="flex gap-2">
              <Select
                value={countryCode}
                onValueChange={setCountryCode}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Register-specific fields */}
          {mode === "register" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            Send OTP
          </Button>
        </>
      ) : (
        <>
          {/* OTP Input */}
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">
                {countryCode} {phone}
              </span>
            </p>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            size="sm"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
            }}
          >
            Didn&apos;t receive code? Resend
          </Button>
        </>
      )}
    </div>
  );
}
