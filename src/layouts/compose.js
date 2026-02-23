import React from "react";

export default function compose(...providers) {
  return function ComposeProviders({ children }) {
    return providers.reduceRight((acc, Provider) => {
      return <Provider>{acc}</Provider>;
    }, children);
  };
}
