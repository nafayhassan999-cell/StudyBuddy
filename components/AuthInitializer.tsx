"use client";

import { useAuthInit } from "@/contexts/AuthContext";

export default function AuthInitializer() {
  useAuthInit();
  return null;
}
