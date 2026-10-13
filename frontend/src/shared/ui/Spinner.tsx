import React from "react";

interface SpinnerProps {
  className?: string;
  sizeClassName?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  className = "flex justify-center items-center",
  sizeClassName = "h-12 w-12 border-t-2 border-b-2 border-indigo-600",
}) => {
  return (
    <div className={className}>
      <div className={`animate-spin rounded-full ${sizeClassName}`}></div>
    </div>
  );
};

