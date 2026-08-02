import { ContentPageView } from "@eduatlas/ui";
import { MetadataEngine } from "@eduatlas/seo";
import { getSeoSiteConfig } from "@/lib/seo-site";

export const metadata = MetadataEngine.resolve("static", getSeoSiteConfig(), {
  pageId: "about",
}).metadata;

export default function AboutPage() {
  return (
    <ContentPageView
      title="Hakkımızda"
      description="Türkiye’nin eğitim rehberi olma vizyonuyla ailelerin yanında."
      breadcrumbs={[
        { id: "home", label: "Ana sayfa", href: "/" },
        { id: "about", label: "Hakkımızda" },
      ]}
    >
      <p>
        Her çocuğun potansiyeli farklıdır. Doğru eğitim ortamı ise bu potansiyelin ortaya
        çıkmasındaki en önemli adımdır. EduAtlas, ailelerin bu önemli kararı daha bilinçli, daha
        güvenilir ve daha kolay verebilmesi için hayata geçirildi.
      </p>
      <p>
        Bugün bir eğitim kurumu seçmek, yalnızca internette birkaç arama yapmaktan çok daha fazlasını
        gerektiriyor. Farklı kaynaklarda dağınık bilgiler, güncelliğini yitirmiş içerikler ve
        doğrulanmamış yorumlar, velilerin doğru kararı vermesini zorlaştırıyor. Biz bu karmaşayı
        ortadan kaldırmayı hedefliyoruz.
      </p>
      <p>
        EduAtlas, Türkiye&apos;nin eğitim rehberi olma vizyonuyla; anaokullarından özel okullara,
        dershanelerden etüt merkezlerine, dil okullarından kurslara kadar eğitim alanındaki
        kurumları tek bir çatı altında bir araya getirir. Amacımız sadece kurumları listelemek değil,
        ailelerin ihtiyaçlarına en uygun eğitim ortamını keşfetmelerini sağlayacak güvenilir ve
        kapsamlı bir platform oluşturmaktır.
      </p>
      <p>
        Platformumuzda yer alan kurum profilleri; iletişim bilgileri, eğitim programları, fiziksel
        olanaklar, fotoğraflar, konum bilgileri ve diğer önemli detaylarla sürekli
        geliştirilmektedir. Kurumların kendileri tarafından güncellenebilen profiller sayesinde
        bilgilerin güncel ve doğru kalmasını önemsiyoruz. Çünkü doğru bilgi, doğru kararın
        temelidir.
      </p>
      <p>
        EduAtlas olarak inanıyoruz ki eğitim yalnızca bir okul seçimi değil, bir çocuğun geleceğine
        yapılan en değerli yatırımdır. Bu nedenle geliştirdiğimiz her özellikte şu soruyu kendimize
        soruyoruz: &quot;Bu, bir velinin daha doğru karar vermesine yardımcı oluyor mu?&quot; Eğer
        cevap evetse, doğru yolda olduğumuzu biliyoruz.
      </p>
      <p>
        Biz yalnızca bir eğitim dizini değil, ailelerin güvenle başvurabileceği, eğitim
        yolculuklarında yanlarında olacak bir rehber olmayı hedefliyoruz. Türkiye&apos;nin dört bir
        yanındaki eğitim kurumlarını şeffaf, erişilebilir ve karşılaştırılabilir hale getirerek, her
        çocuğun kendisine en uygun eğitim ortamına ulaşmasına katkı sağlamayı amaçlıyoruz.
      </p>
      <p>
        EduAtlas, geleceğe atılan en önemli adımın doğru eğitimle başladığına inanır. Bu yolculukta
        ailelerin güvenilir rehberi olmak için her gün çalışmaya devam ediyoruz.
      </p>
    </ContentPageView>
  );
}
