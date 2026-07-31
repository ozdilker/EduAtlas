import {
  ContentPageView,
  LEGAL_CONTACT_EMAIL,
  LEGAL_PAGE_NEXT_STEPS,
  LEGAL_UPDATED_AT_LABEL,
  LegalDocument,
} from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "EduAtlas’ın çerez ve benzeri teknolojileri nasıl kullandığına dair bilgilendirme.",
};

export default function CookiesPage() {
  return (
    <ContentPageView
      title="Çerez Politikası"
      description="Sitemizde kullanılan çerezler ve benzeri teknolojiler hakkında bilgilendirme."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "cookies", label: "Çerez Politikası" },
      ]}
      nextSteps={[...LEGAL_PAGE_NEXT_STEPS]}
    >
      <LegalDocument
        updatedAtLabel={LEGAL_UPDATED_AT_LABEL}
        sections={[
          {
            id: "nedir",
            title: "1. Çerez nedir?",
            children: (
              <>
                <p>
                  Çerezler; cihazınıza kaydedilen küçük metin dosyalarıdır. Oturum yönetimi,
                  güvenlik, tercihlerin hatırlanması ve (kullanıldığında) analitik ölçüm için
                  kullanılabilir. Benzer teknolojiler (yerel depolama vb.) de bu politikanın
                  kapsamına girer.
                </p>
              </>
            ),
          },
          {
            id: "turler",
            title: "2. Kullandığımız çerez türleri",
            children: (
              <>
                <ul>
                  <li>
                    <strong>Zorunlu / işlevsel:</strong> Oturum açma, güvenlik, yük dengeleme ve
                    temel site işlevleri için gereklidir. Bunlar olmadan hizmet düzgün
                    çalışmayabilir.
                  </li>
                  <li>
                    <strong>Tercih:</strong> Dil veya arayüz tercihlerinizi hatırlamak için
                    kullanılabilir.
                  </li>
                  <li>
                    <strong>Analitik / performans:</strong> Trafik ve kullanım istatistiklerini
                    toplulaştırılmış biçimde anlamak için kullanılabilir. Bu tür araçlar
                    kullanıldığında bu metin güncellenir.
                  </li>
                </ul>
                <p>
                  EduAtlas şu aşamada üçüncü taraf reklam çerezleri kullanmamayı hedefler. Yeni
                  araçlar eklendiğinde bu sayfa güncellenir.
                </p>
              </>
            ),
          },
          {
            id: "yonetim",
            title: "3. Çerezleri yönetme",
            children: (
              <>
                <p>
                  Tarayıcı ayarlarından çerezleri silebilir, engelleyebilir veya uyarı
                  alabilirsiniz. Zorunlu çerezleri engellemek oturum ve güvenlik özelliklerini
                  bozabilir. Cihaz/tarayıcı bazlı yönetim için ilgili tarayıcının yardım
                  sayfalarına bakınız.
                </p>
              </>
            ),
          },
          {
            id: "sure",
            title: "4. Saklama süresi",
            children: (
              <>
                <p>
                  Oturum çerezleri tarayıcı kapanınca silinebilir; kalıcı çerezler amaçlarına
                  uygun sürelerle cihazınızda kalabilir. Ayrıntılı saklama pratikleri{" "}
                  <a href="/privacy">Gizlilik Politikası</a> ve <a href="/kvkk">KVKK</a> metinleriyle
                  birlikte değerlendirilir.
                </p>
              </>
            ),
          },
          {
            id: "iletisim",
            title: "5. İletişim",
            children: (
              <>
                <p>
                  Çerezler ve kişisel veriler hakkında sorularınız için{" "}
                  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> adresine
                  yazabilirsiniz.
                </p>
              </>
            ),
          },
        ]}
      />
    </ContentPageView>
  );
}
