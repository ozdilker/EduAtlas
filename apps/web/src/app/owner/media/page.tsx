import { redirect } from "next/navigation";

/**
 * Media tab removed — keep URL stable by sending owners to the portal overview.
 */
export default function OwnerMediaRoute() {
  redirect("/owner");
}
