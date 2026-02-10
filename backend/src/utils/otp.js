import crypto from "crypto";

export function generateOtp6() {
  // 100000 - 999999
  const n = crypto.randomInt(100000, 1000000);
  return String(n);
}

export function hashOtp(otp) {
  const secret = process.env.OTP_SECRET;
  if (!secret) throw new Error("Missing OTP_SECRET");

  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}
