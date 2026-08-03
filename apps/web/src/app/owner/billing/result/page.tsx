import { Container } from "@eduatlas/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerContext } from "@/server/owner/require-owner-context";

export const dynamic = "force-dynamic";

type ResultPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function OwnerBillingResultPage({ searchParams }: ResultPageProps) {
  await requireOwnerContext();
  const params = await searchParams;
  const status = params.status === "fail" ? "fail" : params.status === "ok" ? "ok" : null;
  if (!status) {
    redirect("/owner/billing");
  }

  const ok = status === "ok";

  return (
    <main className="ea-owner-portal">
      <Container size="md">
        <div className="ea-owner-billing-result">
          <h1>{ok ? "Ödeme alındı" : "Ödeme tamamlanamadı"}</h1>
          <p>
            {ok
              ? "Ödemeniz alındı. Paketiniz kısa süre içinde aktifleşir. Durum güncellenmediyse birkaç saniye bekleyip üyelik sayfasını yenileyin."
              : "Ödeme işlemi tamamlanamadı. Tekrar denemek için üyelik paketleri sayfasına dönebilirsiniz."}
          </p>
          <Link className="ea-button ea-button--primary" href="/owner/billing">
            Üyelik paketlerine dön
          </Link>
        </div>
      </Container>
    </main>
  );
}
