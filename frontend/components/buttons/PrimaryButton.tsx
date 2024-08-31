"use client";

import { ReactNode } from "react";

export const PrimaryButton = ({
  children,
  onClick,
  size = "small",
}: {
  children: ReactNode;
  onClick: () => void;
  size?: "big" | "small";
}) => {
  return (
    <div
      onClick={onClick}
      className={`${size === "small" ? "text-sm" : "text-xl"} ${
        size === "small" ? "px-8 pt-2" : "px-10 py-4"
      } bg-amber-700 text-white rounded-full hover:shadow-md cursor-pointer text-center`}
    >
      {children}
    </div>
  );
};
