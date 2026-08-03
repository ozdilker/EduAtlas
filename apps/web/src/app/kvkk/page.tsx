import {
  ContentPageView,
  LEGAL_PAGE_NEXT_STEPS,
  LEGAL_UPDATED_AT_LABEL,
  LegalDocument,
} from "@eduatlas/ui";
import { MetadataEngine } from "@eduatlas/seo";
import { getSeoSiteConfig } from "@/lib/seo-site";
import { getPublicOrganizationContact } from "@/server/site/get-public-organization-contact";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "kvkk",
}).metadata;

export default async function KvkkPage() {
  const { email: LEGAL_CONTACT_EMAIL } = await getPublicOrganizationContact();
  return (
    <ContentPageView
      title="KVKK Aydınlatma Metni"
      description="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında bilgilendirme."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "kvkk", label: "KVKK" },
      ]}
      nextSteps={[...LEGAL_PAGE_NEXT_STEPS]}
    >
      <LegalDocument
        updatedAtLabel={LEGAL_UPDATED_AT_LABEL}
        sections={[
          {
            id: "sorumlu",
            title: "1. Veri sorumlusu",
            children: (
              <>
                <p>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel
                  verileriniz; veri sorumlusu sıfatıyla <strong>EduAtlas</strong> tarafından
                  aşağıda açıklanan kapsamda işlenebilir.
                </p>
                <p>
                  İletişim:{" "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
                </p>
                <p>
                  Ticari unvan, açık adres ve MERSİS bilgileri ileride bu metne eklenecektir. Şimdilik
                  başvurular e-posta yoluyla alınır.
                </p>
              </>
            ),
          },
          {
            id: "kategoriler",
            title: "2. İşlenen kişisel veri kategorileri",
            children: (
              <>
                <ul>
                  <li>Kimlik (ad, soyad)</li>
                  <li>İletişim (telefon, e-posta)</li>
                  <li>Talep / mesaj içeriği ve tercih edilen iletişim zamanı</li>
                  <li>İşlem güvenliği (IP, oturum, log, çerez tanımlayıcıları)</li>
                  <li>
                    Kurum paneli kullanıcıları için hesap ve yetki bilgileri; kurum profiline
                    ilişkin paylaşılan içerikler
                  </li>
                </ul>
              </>
            ),
          },
          {
            id: "amac-hukuki",
            title: "3. İşleme amaçları ve hukuki sebepler",
            children: (
              <>
                <p>Kişisel veriler başlıca şu amaçlarla işlenir:</p>
                <ul>
                  <li>
                    Eğitim kurumu keşfi ve Platform hizmetlerinin sunulması (KVKK md. 5/2-c, f;
                    sözleşmenin kurulması/ifası ve meşru menfaat)
                  </li>
                  <li>
                    Lead / iletişim talebinin ilgili kuruma iletilmesi (açık rıza ve/veya talep
                    sahibinin talebinin yerine getirilmesi)
                  </li>
                  <li>Hesap yönetimi, güvenlik, kötüye kullanımın önlenmesi (meşru menfaat)</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi (KVKK md. 5/2-ç)</li>
                </ul>
              </>
            ),
          },
          {
            id: "aktarim",
            title: "4. Aktarım",
            children: (
              <>
                <p>
                  Lead sürecinde, verdiğiniz onay çerçevesinde verileriniz ilgili eğitim kurumuna
                  aktarılabilir. Hizmet altyapısı (barındırma, e-posta gönderimi, güvenlik)
                  sağlayan iş ortaklarına, KVKK’ya uygun şekilde ve amaçla sınırlı olarak
                  aktarım yapılabilir. Yurt dışı aktarım söz konusu olursa KVKK’nın öngördüğü
                  güvenceler aranır.
                </p>
              </>
            ),
          },
          {
            id: "toplama",
            title: "5. Toplama yöntemi",
            children: (
              <>
                <p>
                  Veriler; web formları, hesap oluşturma / giriş, kurum paneli işlemleri, çerezler
                  ve sunucu kayıtları aracılığıyla elektronik ortamda toplanır.
                </p>
              </>
            ),
          },
          {
            id: "haklar",
            title: "6. İlgili kişinin hakları",
            children: (
              <>
                <p>KVKK md. 11 uyarınca:</p>
                <ul>
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                  <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde / yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                  <li>KVKK md. 7 çerçevesinde silinmesini / yok edilmesini isteme</li>
                  <li>İşlemeye itiraz etme ve zararın giderilmesini talep etme</li>
                </ul>
                <p>
                  Başvurularınızı{" "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> adresine
                  iletebilirsiniz. Talepler, KVKK ve ilgili mevzuatta öngörülen sürelerde
                  yanıtlanır. Gerekirse kimlik doğrulama istenebilir.
                </p>
              </>
            ),
          },
          {
            id: "ilgili",
            title: "7. İlgili belgeler",
            children: (
              <>
                <p>
                  Genel gizlilik uygulamaları için <a href="/privacy">Gizlilik Politikası</a>,
                  çerezler için <a href="/cookies">Çerez Politikası</a>, hizmet kullanımı için{" "}
                  <a href="/terms">Kullanım Koşulları</a> geçerlidir.
                </p>
              </>
            ),
          },
        ]}
      />
    </ContentPageView>
  );
}
