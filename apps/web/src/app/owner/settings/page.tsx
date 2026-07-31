import { redirect } from "next/navigation";

/**
 * Settings tab removed — keep URL stable by sending owners to the portal overview.
 */
export default function OwnerSettingsRoute() {
  redirect("/owner");
}
