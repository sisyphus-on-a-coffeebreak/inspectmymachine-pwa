import { useEffect, useState } from "react";

export function useAppVisible() {
  const [visible, setVisible] = useState(typeof document === "undefined" ? true : !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}
