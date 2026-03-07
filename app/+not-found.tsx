import { Redirect } from "expo-router";
import type { Href } from "expo-router";

/** Any unmatched route (e.g. orbit:///) redirects to login. */
export default function NotFound() {
  return <Redirect href={"/auth/login" as Href} />;
}
