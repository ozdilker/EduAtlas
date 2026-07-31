import {
  ContentPageView,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PAGE_NEXT_STEPS,
  LEGAL_UPDATED_AT_LABEL,
  LegalDocument,
} from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "EduAtlas platformunu kullanırken geçerli olan kullanım koşulları ve hizmet şartları.",
};

export default function TermsPage() {
  return (
    <ContentPageView
      title="Kullanım Koşulları"
      description="EduAtlas web sitesi ve hizmetlerini kullanmadan önce lütfen bu koşulları okuyun."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "terms", label: "Kullanım Koşulları" },
      ]}
      nextSteps={[...LEGAL_PAGE_NEXT_STEPS]}
    >
      <LegalDocument
        updatedAtLabel={LEGAL_UPDATED_AT_LABEL}
        sections={[
          {
            id: "taraflar",
            title: "1. Taraflar ve kapsam",
            children: (
              <>
                <p>
                  Bu Kullanım Koşulları, EduAtlas (“Platform”, “biz”) ile Platform’u ziyaret eden
                  veya kullanan gerçek/tüzel kişiler (“Kullanıcı”, “siz”) arasındaki ilişkiyi
                  düzenler. Platform’a erişerek veya hizmetlerimizi kullanarak bu koşulları kabul
                  etmiş sayılırsınız.
                </p>
                <p>
                  EduAtlas; eğitim kurumlarının keşfi, kurum profillerinin görüntülenmesi, veli /
                  aday iletişim taleplerinin iletilmesi ve kurum sahiplerinin panel üzerinden
                  profil/lead yönetimi yapması için bir dijital rehber hizmeti sunar.
                </p>
              </>
            ),
          },
          {
            id: "hizmet",
            title: "2. Hizmetin niteliği",
            children: (
              <>
                <p>
                  Platform’daki kurum bilgileri bilgilendirme amaçlıdır. EduAtlas, kurumlarla veli /
                  öğrenci arasında sözleşme aracısı, eğitim hizmeti sağlayıcısı veya resmi onay
                  makamı değildir. Nihai karar ve sözleşme ilişkisi ilgili kurum ile Kullanıcı
                  arasındadır.
                </p>
                <p>
                  Üyelik paketleri, deneme süreleri ve ücretli özellikler ayrıca duyurulur; ödeme
                  altyapısı aktif olduğunda ilgili plan koşulları ayrıca uygulanır.
                </p>
              </>
            ),
          },
          {
            id: "hesap",
            title: "3. Hesap ve kurum paneli",
            children: (
              <>
                <p>
                  Kurum paneli veya yönetici erişimi için doğru ve güncel bilgiler vermek,
                  kimlik bilgilerinizi korumak ve yetkisiz kullanımı derhal bildirmek
                  sorumluluğunuzdadır. Hesabınız üzerinden yapılan işlemlerden, yetkisiz kullanım
                  hariç, siz sorumlusunuz.
                </p>
                <p>
                  Kurum sahiplenme (claim) süreçlerinde sunulan belgelerin doğruluğu beyan
                  sahibine aittir. Yanıltıcı beyanlar erişimin askıya alınması veya sonlandırılması
                  sonucunu doğurabilir.
                </p>
              </>
            ),
          },
          {
            id: "yasaklar",
            title: "4. Yasak kullanımlar",
            children: (
              <>
                <p>Aşağıdakiler yasaktır:</p>
                <ul>
                  <li>Yanıltıcı, hukuka aykırı veya hak ihlali içeren içerik paylaşmak</li>
                  <li>Platform’u spam, kötüye kullanım veya otomatik tarama ile yormak</li>
                  <li>Başkalarının kişisel verilerini izinsiz toplamak veya yaymak</li>
                  <li>Güvenlik önlemlerini aşmaya veya sisteme izinsiz erişmeye çalışmak</li>
                  <li>Ticari marka, içerik veya yazılımı izinsiz kopyalamak / tersine mühendislik</li>
                </ul>
              </>
            ),
          },
          {
            id: "icerik",
            title: "5. İçerik ve fikri mülkiyet",
            children: (
              <>
                <p>
                  EduAtlas markası, arayüz tasarımı, yazılım ve Platform içeriğinin (kullanıcı /
                  kurum tarafından sağlananlar hariç) hakları EduAtlas’a aittir. Kurumların
                  yüklediği logo, görsel ve metinler ilgili kuruma aittir; Platform’a yükleyerek
                  hizmetin sunulması için gerekli lisansları vermiş sayılırsınız.
                </p>
              </>
            ),
          },
          {
            id: "sorumluluk",
            title: "6. Sorumluluğun sınırları",
            children: (
              <>
                <p>
                  Platform “olduğu gibi” sunulur. Kurum bilgilerinin eksiksizliği, güncelliği veya
                  uygunluğu garanti edilmez. Dolaylı, arızi veya sonuç zararlarından, yürürlükteki
                  hukukun izin verdiği ölçüde sorumlu tutulmayız. Zorunlu tüketici hakları saklıdır.
                </p>
              </>
            ),
          },
          {
            id: "degisiklik",
            title: "7. Değişiklikler ve iletişim",
            children: (
              <>
                <p>
                  Bu koşulları güncelleyebiliriz. Önemli değişikliklerde sayfada güncel tarih
                  yayınlanır. Sorularınız için{" "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> adresine
                  yazabilirsiniz. Ayrıntılı kişisel veri uygulamaları için{" "}
                  <a href="/privacy">Gizlilik Politikası</a> ve <a href="/kvkk">KVKK</a> metinlerine
                  bakınız.
                </p>
              </>
            ),
          },
        ]}
      />
    </ContentPageView>
  );
}
