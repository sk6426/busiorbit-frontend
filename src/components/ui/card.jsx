// File: src/components/ui/card.jsx
import React from "react";
import classNames from "classnames";

export function Card({ className = "", children, ...props }) {
  return (
    <div
      className={classNames(
        "rounded-2xl bg-white shadow p-4 border border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
