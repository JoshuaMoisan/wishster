"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  value: string;
  size?: number;
  className?: string;
};

export function QrDisplay({ value, size = 160, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#171717", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!src) {
    return (
      <Skeleton
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
    />
  );
}
