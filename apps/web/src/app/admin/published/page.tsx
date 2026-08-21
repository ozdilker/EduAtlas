import { redirect } from "next/navigation";

/**
 * Yayındaki kurumlar page retired — review queue covers published listings.
 */
export default function AdminPublishedRedirect() {
  redirect("/admin/review?queue=published");
}
