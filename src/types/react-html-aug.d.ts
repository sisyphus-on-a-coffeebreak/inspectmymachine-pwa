// augments React's InputHTMLAttributes to include the "capture" attribute
import "react";

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // Accept the common values; boolean is also seen in the wild
    capture?: boolean | "user" | "environment";
  }
}
