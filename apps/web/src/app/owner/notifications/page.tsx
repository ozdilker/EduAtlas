import { redirect } from "next/navigation";

/**
 * Notifications tab removed — keep URL stable by sending owners to the portal overview.
 */
export default function OwnerNotificationsRoute() {
  redirect("/owner");
}
