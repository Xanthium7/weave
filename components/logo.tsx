import { Press_Start_2P } from "next/font/google";
interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

const logoFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-logo",
});

export function Logo({ className = "", iconOnly = false }: LogoProps) {
  return (
    <div
      className={`flex items-center gap-2.5 font-sans font-semibold tracking-tight text-xl text-black dark:text-white group cursor-pointer ${className}`}
    >
      {!iconOnly && (
        <span
          className={`${logoFont.className} text-[24px] tracking-normal text-neutral-900 dark:text-neutral-50`}
        >
          WEAVE
        </span>
      )}
    </div>
  );
}
