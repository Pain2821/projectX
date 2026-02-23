import { useContext } from "react";
import { IssContext } from "../context";

export function useIss() {
  const context = useContext(IssContext);

  if (!context) {
    throw new Error("useIss must be used within IssProvider");
  }

  return context;
}
