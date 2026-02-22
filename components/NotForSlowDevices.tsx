"use client";

import { useDetectGPU } from "@react-three/drei";
import type { ReactNode } from "react";

interface NotForSlowDevicesProps {
  children: ReactNode;
}

export default function NotForSlowDevices({
  children,
}: NotForSlowDevicesProps) {
  const gpu = useDetectGPU();
  const shouldShow = gpu.tier > 1 && !gpu.isMobile;
  if (!shouldShow) {
    return null;
  }
  return children;
}
