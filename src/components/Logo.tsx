import Image from "next/image";
import Link from "next/link";

export function Logo({ variant = "color", className }: { variant?: "color" | "white"; className?: string }) {
  const src =
    variant === "white"
      ? "/brand/Logo Stratetic New White-01.png"
      : "/brand/Logo Stratetic New-01.png";
  return (
    <Link href="/" className={className}>
      <Image src={src} alt="Agence Stratetic" width={160} height={40} priority className="h-8 w-auto" />
    </Link>
  );
}
