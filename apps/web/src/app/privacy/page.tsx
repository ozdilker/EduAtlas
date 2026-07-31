import {
  ContentPageView,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PAGE_NEXT_STEPS,
  LEGAL_UPDATED_AT_LABEL,
  LegalDocument,
} from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "EduAtlas’ın kişisel verileri nasıl topladığı, kullandığı ve koruduğuna dair gizlilik politikası.",
};

export default function PrivacyPage() {
  return (
    <ContentPageView
      title="Gizlilik Politikası"
      description="Kişisel verilerinizin nasıl işlendiğini şeffaf biçimde açıklıyoruz."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "privacy", label: "Gizlilik Politikası" },
      ]}
      nextSteps={[...LEGAL_PAGE_NEXT_STEPS]}
    >
      <LegalDocument
        updatedAtLabel={LEGAL_UPDATED_AT_LABEL}
        sections={[
          {
            id: "giris",
            title: "1. Giriş",
            children: (
              <>
                <p>
                  Bu Gizlilik Politikası, EduAtlas’ın (“Platform”) web sitesi ve ilgili
                  hizmetlerinde kişisel verilerinizi nasıl topladığını, kullandığını, sakladığını ve
                  koruduğunu açıklar. 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)
                  kapsamında ayrıntılı aydınlatma için <a href="/kvkk">KVKK metnimizi</a> de
                  inceleyiniz.
                </p>
              </>
            ),
          },
          {
            id: "sorumlu",
            title: "2. Veri sorumlusu",
            children: (
              <>
                <p>
                  Veri sorumlusu: <strong>EduAtlas</strong>
                  <br />
                  İletişim:{" "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
                </p>
              </>
            ),
          },
          {
            id: "toplanan",
            title: "3. Toplanan veriler",
            children: (
              <>
                <p>Hizmete göre şu kategoriler işlenebilir:</p>
                <ul>
                  <li>
                    <strong>İletişim / lead:</strong> ad-soyad, telefon, e-posta, mesaj, tercih
                    edilen iletişim zamanı, onay kaydı
                  </li>
                  <li>
                    <strong>Hesap / kurum paneli:</strong> kimlik/iletişim bilgileri, kurum profili
                    içerikleri, yetkilendirme kayıtları
                  </li>
                  <li>
                    <strong>Teknik:</strong> IP, tarayıcı/cihaz bilgisi, çerez ve benzeri
                    tanımlayıcılar, güvenlik ve performans günlükleri
                  </li>
                  <li>
                    <strong>Kullanım:</strong> sayfa görüntüleme, arama ve etkileşim istatistikleri
                    (mümkün olduğunca toplulaştırılmış)
                  </li>
                </ul>
              </>
            ),
          },
          {
            id: "amac",
            title: "4. İşleme amaçları",
            children: (
              <>
                <ul>
                  <li>Kurum keşfi ve bilgilendirme hizmetinin sunulması</li>
                  <li>Lead / iletişim taleplerinin ilgili kuruma iletilmesi</li>
                  <li>Hesap, güvenlik, kötüye kullanım önleme ve destek</li>
                  <li>Hizmet iyileştirme, analitik ve ürün geliştirme</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                </ul>
              </>
            ),
          },
          {
            id: "paylasim",
            title: "5. Paylaşım",
            children: (
              <>
                <p>
                  Lead formunda onayınız doğrultusunda iletişim bilgileriniz ilgili eğitim kurumuna
                  iletilir. Altyapı sağlayıcıları (barındırma, e-posta, analitik vb.) hizmetin
                  yürütülmesi için sınırlı erişimle kullanılabilir. Yasal zorunluluk veya hakların
                  korunması halleri saklıdır. Verilerinizi satmayız.
                </p>
              </>
            ),
          },
          {
            id: "saklama",
            title: "6. Saklama ve güvenlik",
            children: (
              <>
                <p>
                  Veriler, işleme amacının gerektirdiği süre ve yasal saklama yükümlülükleriyle
                  sınırlı tutulur. Teknik ve idari tedbirlerle yetkisiz erişime karşı korunmaya
                  çalışılır; hiçbir sistem %100 riskten ari değildir.
                </p>
              </>
            ),
          },
          {
            id: "haklar",
            title: "7. Haklarınız",
            children: (
              <>
                <p>
                  KVKK md. 11 kapsamında erişim, düzeltme, silme, işlemeyi kısıtlama, itiraz ve
                  şikâyet haklarınız vardır. Başvurularınızı{" "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> adresine
                  iletebilirsiniz. Çerez tercihlerine ilişkin bilgi için{" "}
                  <a href="/cookies">Çerez Politikası</a>’na bakınız.
                </p>
              </>
            ),
          },
          {
            id: "guncelleme",
            title: "8. Güncellemeler",
            children: (
              <>
                <p>
                  Bu politikayı zaman zaman güncelleyebiliriz. Yürürlükteki sürüm bu sayfada
                  yayınlanır; üstteki son güncelleme tarihine bakınız.
                </p>
              </>
            ),
          },
        ]}
      />
    </ContentPageView>
  );
}
