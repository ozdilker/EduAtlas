/**
 * Design Kit v1.0 — generates 81 city asset specification markdown files.
 * Documentation only; does not touch application code.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "city-assets");
const citiesDir = path.join(root, "cities");
fs.mkdirSync(citiesDir, { recursive: true });

/** @type {Array<{
 *  slug: string,
 *  name: string,
 *  plate: number,
 *  region: string,
 *  hero: string,
 *  alts: string[],
 *  palette: string[],
 *  seasons: string[],
 *  direction: string,
 *  forbidden: string[]
 * }>} */
const cities = [
  ["adana", "Adana", 1, "Akdeniz", "Sabancı Merkez Camii ve Seyhan Nehri silueti", ["Taşköprü", "Atatürk Parkı kampüs yakını"], ["#C8102E", "#009488", "#F59E0B", "#0F172A"], ["İlkbahar", "Sonbahar"], "Nehir + camii dengesi; sıcak Akdeniz ışığı; eğitim kampüsü yan planları", ["Sadece festival kalabalığı", "Aşırı turkuaz tatil filtresi"]],
  ["adiyaman", "Adıyaman", 2, "Güneydoğu", "Nemrut Dağı heykelleri (uzak, saygılı kadraj)", ["Perre antik kenti", "Merkez eğitim koridoru"], ["#C8102E", "#92400E", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Arkeolojik saygınlık; sıcak taş; sisli şafak", ["Turist selfie estetiği", "Heykelleri komikleştiren açılar"]],
  ["afyonkarahisar", "Afyonkarahisar", 3, "Ege", "Afyon Kalesi kayalık silueti", ["Zafer Müzesi çevresi", "Termal kampüs atmosferi"], ["#C8102E", "#78716C", "#009488", "#0F172A"], ["İlkbahar", "Yaz"], "Kayalık kale + şehir dokusu; net sabah ışığı", ["Sadece termal otel broşürü", "Yemek close-up hero"]],
  ["agri", "Ağrı", 4, "Doğu", "Ağrı Dağı uzak silueti", ["İshak Paşa Sarayı (uzak)", "Şehir merkezi eğitim aksı"], ["#C8102E", "#334155", "#009488", "#E2E8F0"], ["Yaz", "Sonbahar"], "Dağ ölçeği + sakin şehir; temiz ince hava", ["Kasvetli boş oyun alanları", "Aşırı soğuk mavi grade"]],
  ["amasya", "Amasya", 5, "Karadeniz", "Yeşilırmak ve kral kaya mezarları silueti", ["Şehzadeler sahil yürüyüşü", "Tarihi konak cepheleri"], ["#C8102E", "#166534", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Nehir yansıması; yeşil vadi; yumuşak ışık", ["Abartılı HDR yeşil", "Kalabalık festival-only kareler"]],
  ["ankara", "Ankara", 6, "İç Anadolu", "Anıtkabir yaklaşımı (saygılı, geniş)", ["Atakule silueti", "Kampüs / Kızılay eğitim aksı (sakin)"], ["#C8102E", "#1E3A5F", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Başkent ciddiyeti; açık gökyüzü; kurumsal sakinlik", ["Politik miting kalabalığı", "Anıtkabir’i ürün reklamı gibi kullanmak"]],
  ["antalya", "Antalya", 7, "Akdeniz", "Kaleiçi / yat limanı editorial", ["Tarihi kapılar", "Kampüs–deniz ufku (mesafeli)"], ["#C8102E", "#0EA5E9", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Akdeniz ışığı kontrollü; turizm abartısız", ["Plaj partisi / jet-ski", "Aşırı turkuaz tatil reklamı"]],
  ["artvin", "Artvin", 8, "Karadeniz", "Çoruh vadisi ve yeşil yamaçlar", ["Merkez köprü aksı", "Yağmur sonrası sisli orman"], ["#C8102E", "#14532D", "#009488", "#E2E8F0"], ["Yaz", "Sonbahar"], "Derinlikli yeşil; sis; sakin yerleşim", ["Rafting aksiyon reklamı", "Neon yeşil grade"]],
  ["aydin", "Aydın", 9, "Ege", "Tralleis / Aphrodisias hissi veya modern kent aksı", ["İncirliova kırsal kampüs", "Merkez saat kulesi alanı"], ["#C8102E", "#CA8A04", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Ege altın ışığı; zeytin / taş doku", ["Sadece plaj kadrajı", "Pazar yeri kaos close-up"]],
  ["balikesir", "Balıkesir", 10, "Marmara", "Saat Kulesi ve meydan", ["Cunda uzaktan (Ayvalık bağlamı)", "Kampüs yeşili"], ["#C8102E", "#0369A1", "#009488", "#0F172A"], ["İlkbahar", "Yaz"], "Marmara netliği; saat kulesi odak", ["Sadece zeytinyağı ürün fotoğrafı", "Kalabalık miting"]],
  ["bilecik", "Bilecik", 11, "Marmara", "Şeyh Edebali türbesi çevresi (saygılı)", ["Osmanlı kuruluş manzarası", "Merkez eğitim koridoru"], ["#C8102E", "#44403C", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Tarihi ciddiyet; yumuşak yeşil", ["Politik sembol abartısı", "Düğün salonu estetiği"]],
  ["bingol", "Bingöl", 12, "Doğu", "Dağ eteklerinde şehir ve yeşil yayla hissi", ["Merkez camii silueti", "Kampüs yolu"], ["#C8102E", "#3F6212", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Temiz dağ havası; doğal yeşil", ["Kasvetli kış boşluğu tek seçenek", "Askeri estetik"]],
  ["bitlis", "Bitlis", 13, "Doğu", "Bitlis Kalesi ve taş mimari", ["Tarihi sokak dokusu", "Ahlat mezar taşları (uzak, saygılı)"], ["#C8102E", "#57534E", "#009488", "#0F172A"], ["Yaz", "Sonbahar"], "Taş doku; sert ama sıcak ışık", ["Mezar close-up", "Kasvetli gri tek ton"]],
  ["bolu", "Bolu", 14, "Karadeniz", "Abant gölü sisli editorial (sakin doğa)", ["Kartalkaya uzak siluet", "Merkez eğitim aksı"], ["#C8102E", "#166534", "#009488", "#F8FAFC"], ["Yaz", "Sonbahar"], "Orman + göl; eğitim için sakin doğa", ["Kayak tatili reklamı baskın", "Sis yüzünden okunaksız landmark"]],
  ["burdur", "Burdur", 15, "Akdeniz", "Salda Gölü kıyı çizgisi (mesafeli)", ["Burdur Gölü", "Merkez eğitim koridoru"], ["#C8102E", "#67E8F9", "#009488", "#0F172A"], ["İlkbahar", "Yaz"], "Mineral mavi kontrollü; doğa koruma tonu", ["İnfluencer Salda pozları", "Aşırı doygun turkuaz"]],
  ["bursa", "Bursa", 16, "Marmara", "Uludağ etekleri + yeşil Bursa silueti", ["Yeşil Türbe çevresi", "Nilüfer modern eğitim aksı"], ["#C8102E", "#15803D", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Yeşil şehir; Osmanlı doku + modern eğitim", ["Sadece kayak merkezi", "Sanayi bacası close-up"]],
  ["canakkale", "Çanakkale", 17, "Marmara", "Çanakkale Şehitler Abidesi (saygılı uzak)", ["Troya / boğaz", "Merkez saat kulesi"], ["#C8102E", "#1E3A5F", "#009488", "#E2E8F0"], ["İlkbahar", "Sonbahar"], "Anma saygınlığı; boğaz ışığı", ["Savaş görselleri sert close-up", "Festival kahramanı"]],
  ["cankiri", "Çankırı", 18, "İç Anadolu", "Çankırı Kalesi silueti", ["Tuz mağarası uzak bağlam", "Merkez eğitim aksı"], ["#C8102E", "#A8A29E", "#009488", "#0F172A"], ["İlkbahar", "Yaz"], "İç Anadolu berrak gökyüzü; kale odak", ["Mağara turizmi abartısı", "Tozlu boş cadde tek görsel"]],
  ["corum", "Çorum", 19, "İç Anadolu", "Hitit müzesi / kale çevresi editorial", ["Merkez saat kulesi", "Kampüs yeşili"], ["#C8102E", "#B45309", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Tarihi derinlik + modern eğitim sakinliği", ["Leblebi ürün reklamı hero", "Arkeoloji kazı close-up"]],
  ["denizli", "Denizli", 20, "Ege", "Pamukkale travertenleri (geniş, sakin)", ["Hierapolis uzak", "Merkez eğitim aksı"], ["#C8102E", "#F8FAFC", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Beyaz taş + mavi gökyüzü; turizm abartısız", ["Havuz pozu", "Kalabalık selfie iskeleleri"]],
  ["diyarbakir", "Diyarbakır", 21, "Güneydoğu", "Surlar ve basalt doku (geniş)", ["On Gözlü Köprü", "Modern eğitim aksı"], ["#C8102E", "#1C1917", "#009488", "#F5F5F4"], ["İlkbahar", "Sonbahar"], "Taş sur ciddiyeti; sıcak ışık; saygı", ["Çatışma / gerilim imgeleri", "Sadece kebap close-up"]],
  ["edirne", "Edirne", 22, "Marmara", "Selimiye Camii kubbe silueti", ["Meriç köprüleri", "Kırkpınar alanı (sezon dışı, sakin)"], ["#C8102E", "#1E3A5F", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Osmanlı ihtişamı sakin; simetri", ["Yağlı güreş aksiyon close-up hero", "Aşırı HDR kubbe"]],
  ["elazig", "Elazığ", 23, "Doğu", "Hazar Gölü kıyı çizgisi", ["Harput Kalesi", "Merkez eğitim koridoru"], ["#C8102E", "#0E7490", "#009488", "#0F172A"], ["Yaz", "Sonbahar"], "Göl + kale dengesi; temiz dağ havası", ["Kasvetli yıkım imgeleri", "Boş otopark hero"]],
  ["erzincan", "Erzincan", 24, "Doğu", "Munzur / geniş ova ve dağ silueti", ["Merkez saat kulesi alanı", "Kampüs"], ["#C8102E", "#365314", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Açık ova; ferah gökyüzü", ["Felaket görselleri", "Gri tekdüze bloklar"]],
  ["erzurum", "Erzurum", 25, "Doğu", "Çifte Minareli Medrese", ["Palandöken uzak siluet", "Üniversite kampüs aksı"], ["#C8102E", "#1E3A5F", "#009488", "#F8FAFC"], ["Yaz", "Sonbahar"], "Tarihi medrese + eğitim metaforu güçlü", ["Sadece kayak tatili", "Buzlu tehlikeli yürüme close-up"]],
  ["eskisehir", "Eskişehir", 26, "İç Anadolu", "Porsuk Çayı ve köprüler", ["Odunpazarı evleri", "Kampüs / tramvay sakin aks"], ["#C8102E", "#009488", "#1E3A5F", "#0F172A"], ["İlkbahar", "Sonbahar"], "Öğrenci şehri enerjisi kontrollü; nehir yansıması", ["Gece kulübü neon", "Mor’u marka rengi gibi UI’ye taşımak"]],
  ["gaziantep", "Gaziantep", 27, "Güneydoğu", "Gaziantep Kalesi", ["Zeugma mozaiği müze cephesi", "Modern eğitim aksı"], ["#C8102E", "#B45309", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Kale taş doku; sıcak Güneydoğu ışığı", ["Sadece baklava close-up", "Kalabalık çarşı kaos"]],
  ["giresun", "Giresun", 28, "Karadeniz", "Giresun Adası / sahil silueti", ["Kale", "Fındık bahçesi mesafeli"], ["#C8102E", "#166534", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Karadeniz yeşili + deniz", ["Yağmurda kasvetli tek seçenek", "Balıkçı tezgâh close-up hero"]],
  ["gumushane", "Gümüşhane", 29, "Karadeniz", "Zigana geçidi yeşil dağlar", ["Merkez taş doku", "Karaca mağarası uzak bağlam"], ["#C8102E", "#3F6212", "#009488", "#F8FAFC"], ["Yaz", "Sonbahar"], "Dağ geçidi ferahlığı", ["Mağara turizmi abartısı", "Sis yüzünden tanımsız kare"]],
  ["hakkari", "Hakkâri", 30, "Doğu", "Zap Vadisi dağ silueti", ["Merkez camii / eğitim aksı", "Yayla yeşili"], ["#C8102E", "#1C1917", "#009488", "#E2E8F0"], ["Yaz"], "Dağ ölçeği; saygı; sakin yerleşim", ["Askeri / çatışma imgeleri", "Tehlikeli uçurum macera reklamı"]],
  ["hatay", "Hatay", 31, "Akdeniz", "Asi Nehri ve Antakya dokusu (yeniden yapılanma saygısı)", ["Titus Tüneli uzak", "Samandağ sahil mesafeli"], ["#C8102E", "#9A3412", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Çok kültürlü miras; umutlu sabah ışığı; hassasiyet", ["Enkaz / yıkım görselleri", "Afet spekülasyonu"]],
  ["isparta", "Isparta", 32, "Akdeniz", "Gül bahçeleri (mesafeli, editorial)", ["Eğirdir Gölü", "Merkez eğitim aksı"], ["#C8102E", "#BE185D", "#009488", "#F8FAFC"], ["İlkbahar", "Yaz"], "Gül rengi kontrollü; göl alternatif", ["Parfüm reklamı close-up", "Pembe’yi marka rengi yapmak"]],
  ["mersin", "Mersin", 33, "Akdeniz", "Mersin marina / sahil promenad", ["Kızkalesi", "Çamlıbel eğitim aksı"], ["#C8102E", "#0284C7", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Akdeniz liman sakinliği; net ışık", ["Gece eğlence neon", "Liman konteyner endüstri close-up"]],
  ["istanbul", "İstanbul", 34, "Marmara", "Galata Kulesi / Haliç editorial (bayrak abartısız)", ["Boğaz üniversite yakını", "Adalar iskele sakin", "Kadıköy sahil mesafeli"], ["#C8102E", "#009488", "#0F172A", "#FBF9FC"], ["İlkbahar", "Sonbahar", "Kış (berrak)"], "Ulusal varsayılan hero; atlas ölçeği; tipografi için scrim", ["Turist selfie kalabalığı", "Bayrak kolajı / sticker", "Gece kulübü"]],
  ["izmir", "İzmir", 35, "Ege", "Konak Saat Kulesi ve körfez", ["Alsancak sahil", "Üniversite kampüs yeşili"], ["#C8102E", "#0EA5E9", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Ege ferahlığı; saat kulesi ikonik ama sakin", ["Foça parti plajı", "Aşırı doygun deniz reklamı"]],
  ["kars", "Kars", 36, "Doğu", "Kars Kalesi ve ızgara kent dokusu", ["Ani Harabeleri uzak", "Taş mimari sokak"], ["#C8102E", "#334155", "#009488", "#E2E8F0"], ["Yaz", "Sonbahar"], "Sert iklimde bile sıcak taş; net gökyüzü", ["Donmuş kasvet tek seçenek", "Kaşar ürün hero"]],
  ["kastamonu", "Kastamonu", 37, "Karadeniz", "Nasrullah Meydanı / tarihi konaklar", ["Kale", "Ilgaz orman mesafeli"], ["#C8102E", "#166534", "#009488", "#F8FAFC"], ["Yaz", "Sonbahar"], "Ahşap konak dokusu; orman yeşili", ["Sadece orman yolu belirsiz", "Festival panayır kaos"]],
  ["kayseri", "Kayseri", 38, "İç Anadolu", "Erciyes Dağı silueti + şehir", ["Çarşı dış cephe sakin", "Kampüs aksı"], ["#C8102E", "#57534E", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Dağ + kent dengesi; eğitim ciddiyeti", ["Sadece pastırma close-up", "Kayak tatili baskın"]],
  ["kirklareli", "Kırklareli", 39, "Marmara", "Yeşil Trakya tepeleri mesafeli", ["Merkez saat kulesi", "Bağ manzarası"], ["#C8102E", "#3F6212", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Trakya yeşili; sakin taş merkez", ["Şarap reklamı abartısı", "Sınır gerilimi imgeleri"]],
  ["kirsehir", "Kırşehir", 40, "İç Anadolu", "Cacabey Medresesi", ["Terme / merkez aks", "Kampüs"], ["#C8102E", "#A16207", "#009488", "#F8FAFC"], ["İlkbahar", "Yaz"], "Medrese = eğitim metaforu güçlü", ["Aşıklar bayramı kalabalık close-up", "Belirsiz ova tek görsel"]],
  ["kocaeli", "Kocaeli", 41, "Marmara", "İzmit körfez silueti sakin", ["Seka Park", "Kampüs / eğitim vadisi"], ["#C8102E", "#0F766E", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Körfez + yeşil park; sanayi gizlensin", ["Fabrika bacası hero", "Trafik sıkışıklığı"]],
  ["konya", "Konya", 42, "İç Anadolu", "Mevlânâ Türbesi yeşil kubbe (saygılı)", ["Alaeddin Tepesi", "Kampüs aksı"], ["#C8102E", "#166534", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Manevi sakinlik; geniş meydan; saygı", ["Semâ turistik gösteri close-up", "Ticari hediyelik dükkân"]],
  ["kutahya", "Kütahya", 43, "Ege", "Çini dokulu tarihi sokak / kale", ["Çini müzesi cephe", "Merkez eğitim aksı"], ["#C8102E", "#1D4ED8", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Çini mavisi mimaride kalsın; UI’ye taşınmaz", ["Çini ürün katalog close-up", "Mavi’yi marka rengi yapmak"]],
  ["malatya", "Malatya", 44, "Doğu", "Beydağı silueti + kent", ["Kayısı bahçesi mesafeli", "Eğitim / umut aksı"], ["#C8102E", "#CA8A04", "#009488", "#E2E8F0"], ["İlkbahar", "Yaz"], "Umutlu sabah; hassasiyet; bahçe uzak plan", ["Enkaz görselleri", "Kayısı ürün reklamı hero"]],
  ["manisa", "Manisa", 45, "Ege", "Spil Dağı etekleri", ["Sultan Camii çevresi", "Üzüm bağı mesafeli"], ["#C8102E", "#4D7C0F", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Dağ + bağ; Ege altın ışığı", ["Sadece üzüm close-up", "Festival kalabalığı"]],
  ["kahramanmaras", "Kahramanmaraş", 46, "Akdeniz", "Maraş Kalesi / merkez siluet (umutlu)", ["Ahır Dağı", "Eğitim / yeniden yapılanma aksı"], ["#C8102E", "#9A3412", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Dayanıklılık ve umut; sabah ışığı; hassasiyet", ["Enkaz / afet spekülasyonu", "Dondurma reklamı hero"]],
  ["mardin", "Mardin", 47, "Güneydoğu", "Taş evler ve Mezopotamya ufku", ["Zinciriye Medresesi", "Deyrulzafaran uzak"], ["#C8102E", "#A16207", "#009488", "#F5F5F4"], ["İlkbahar", "Sonbahar"], "Altın taş; altın saat; medrese eğitim metaforu", ["Romantik balayı klişesi abartısı", "Dar sokak kaos"]],
  ["mugla", "Muğla", 48, "Ege", "Muğla taş evler / çam kokulu tepe", ["Bodrum kale uzak (opsiyonel)", "Köyceğiz göl mesafeli"], ["#C8102E", "#0D9488", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Ege taş + çam; tatil abartısız", ["Yacht party", "Gececlub Bodrum"]],
  ["mus", "Muş", 49, "Doğu", "Ovalar ve dağ silueti", ["Merkez camii", "Kampüs yolu"], ["#C8102E", "#3F6212", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Geniş ova ferahlığı; sakin yerleşim", ["Kasvetli tek seçenek", "Askeri estetik"]],
  ["nevsehir", "Nevşehir", 50, "İç Anadolu", "Kapadokya peri bacaları (geniş editorial)", ["Uçhisar Kalesi", "Merkez eğitim aksı"], ["#C8102E", "#D6D3D1", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Peri bacası ikonik ama sakin; balon seyrek", ["Balon gökyüzü spam", "Turist selfie dolu teras"]],
  ["nigde", "Niğde", 51, "İç Anadolu", "Niğde Kalesi / Alaaddin Camii çevresi", ["Gümüşler Manastırı uzak", "Kampüs"], ["#C8102E", "#78716C", "#009488", "#F8FAFC"], ["İlkbahar", "Yaz"], "İç Anadolu taş; berrak ışık", ["Belirsiz kırsal tek görsel", "Toz fırtınası"]],
  ["ordu", "Ordu", 52, "Karadeniz", "Boztepe manzarası / sahil", ["Taşbaşı iskele", "Fındık yamaç mesafeli"], ["#C8102E", "#166534", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Yeşil yamaç + deniz", ["Teleferik reklamı abartısı", "Yağmur kasveti tek seçenek"]],
  ["rize", "Rize", 53, "Karadeniz", "Çay bahçeleri yamaç (mesafeli)", ["Merkez köprü / nehir", "Ayder uzak (opsiyonel)"], ["#C8102E", "#14532D", "#009488", "#F8FAFC"], ["Yaz", "İlkbahar"], "Yoğun yeşil kontrollü; sis katmanı", ["Çay bardığı ürün close-up", "Neon yeşil grade"]],
  ["sakarya", "Sakarya", 54, "Marmara", "Sapanca Gölü kıyı çizgisi", ["Merkez eğitim aksı", "Yeşil park koridoru"], ["#C8102E", "#0F766E", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Göl ferahlığı; Marmara yeşili", ["Sadece sanayi bölgesi", "Trafik otoyol close-up"]],
  ["samsun", "Samsun", 55, "Karadeniz", "Bandırma Vapuru / sahil parkı editorial", ["Amazon Adası uzak", "Üniversite kampüs aksı"], ["#C8102E", "#1E3A5F", "#009488", "#FBF9FC"], ["İlkbahar", "Yaz"], "Kurtuluş saygınlığı + sahil sakinliği", ["Politik miting", "Balık hali kaos"]],
  ["siirt", "Siirt", 56, "Güneydoğu", "Ulu Camii / taş kent dokusu", ["Botan Vadisi uzak", "Merkez eğitim aksı"], ["#C8102E", "#92400E", "#009488", "#F5F5F4"], ["İlkbahar", "Sonbahar"], "Taş sıcaklığı; saygılı kent", ["Çatışma imgeleri", "Sadece fıstık ürün close-up"]],
  ["sinop", "Sinop", 57, "Karadeniz", "Sinop Kalesi ve doğal liman", ["Hapishane müzesi uzak (saygılı)", "Sahil yürüyüşü"], ["#C8102E", "#0E7490", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Kuzey liman netliği; huzur", ["Hapishane dramatik close-up", "Fırtına kasveti tek seçenek"]],
  ["sivas", "Sivas", 58, "İç Anadolu", "Çifte Minareli Medrese", ["Kongre binası çevresi", "Kampüs aksı"], ["#C8102E", "#1E3A5F", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Medrese eğitim metaforu; İç Anadolu berraklığı", ["Kangal köpeği ürün reklamı", "Kar kasveti tek seçenek"]],
  ["tekirdag", "Tekirdağ", 59, "Marmara", "Tekirdağ sahil / Rakoczi müzesi çevresi sakin", ["Bağ yamaçları mesafeli", "Merkez eğitim aksı"], ["#C8102E", "#0369A1", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Marmara sahil sakinliği", ["İçki reklamı abartısı", "Plaj partisi"]],
  ["tokat", "Tokat", 60, "Karadeniz", "Tokat Kalesi ve tarihi evler", ["Ballıca Mağarası uzak", "Merkez eğitim aksı"], ["#C8102E", "#166534", "#009488", "#F8FAFC"], ["Yaz", "Sonbahar"], "Kale + yeşil vadi", ["Mağara turizmi abartısı", "Belirsiz kırsal tek görsel"]],
  ["trabzon", "Trabzon", 61, "Karadeniz", "Sümela Manastırı (uzak, sisli editorial)", ["Boztepe", "Sahil / meydan sakin"], ["#C8102E", "#14532D", "#009488", "#0F172A"], ["Yaz", "İlkbahar"], "Manastır saygınlığı; Karadeniz yeşili", ["Taraftar gerilim imgeleri", "Uzungöl aşırı kalabalık selfie"]],
  ["tunceli", "Tunceli", 62, "Doğu", "Munzur Vadisi yeşil akarsu", ["Merkez köprü", "Dağ yaylası"], ["#C8102E", "#166534", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Doğa koruma tonu; berrak su", ["Politik gerilim", "Tehlikeli rafting aksiyon reklamı"]],
  ["sanliurfa", "Şanlıurfa", 63, "Güneydoğu", "Balıklıgöl editorial (saygılı)", ["Göbeklitepe uzak bağlam", "Tarihi çarşı dış cephe sakin"], ["#C8102E", "#B45309", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Kutsal sakinlik; altın taş; tarih derinliği", ["Balık yemleme close-up abartısı", "Çarşı karmaşa"]],
  ["usak", "Uşak", 64, "Ege", "Uşak Arkeoloji Müzesi / kent merkezi sakin", ["Ulubey Kanyonu mesafeli", "Kampüs aksı"], ["#C8102E", "#A16207", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Ege içi sakin kent; kanyon alternatif", ["Halı ürün katalog hero", "Kanyon uçurum macera spam"]],
  ["van", "Van", 65, "Doğu", "Van Gölü ve Van Kalesi silueti", ["Akdamar Adası kilisesi uzak", "Merkez eğitim aksı"], ["#C8102E", "#0E7490", "#009488", "#0F172A"], ["Yaz", "Sonbahar"], "Göl ölçeği; kale; temiz ince hava", ["Sadece kedi ürün reklamı", "Askeri estetik"]],
  ["yozgat", "Yozgat", 66, "İç Anadolu", "Yozgat Çamlığı / saat kulesi alanı", ["Merkez eğitim aksı", "Boğazkale uzak bağlam"], ["#C8102E", "#3F6212", "#009488", "#F8FAFC"], ["İlkbahar", "Yaz"], "Çamlık ferahlığı; İç Anadolu netliği", ["Belirsiz ova tek görsel", "Tozlu boşluk"]],
  ["zonguldak", "Zonguldak", 67, "Karadeniz", "Karadeniz sahil ve yeşil yamaç", ["Merkez eğitim aksı", "Uzun Mehmet anıtı uzak (saygılı)"], ["#C8102E", "#1E3A5F", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Sahil + yeşil; madencilik gizlensin", ["Maden ocağı / toz close-up", "Kasvetli liman endüstri"]],
  ["aksaray", "Aksaray", 68, "İç Anadolu", "Aksaray Ulu Camii / Ihlara uzak bağlam", ["Belisırma vadisi mesafeli", "Merkez eğitim aksı"], ["#C8102E", "#78716C", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Kapadokya güney kapısı sakinliği", ["Vadi macera spam", "Turist balon kolajı"]],
  ["bayburt", "Bayburt", 69, "Karadeniz", "Bayburt Kalesi", ["Çoruh nehri", "Merkez eğitim aksı"], ["#C8102E", "#334155", "#009488", "#E2E8F0"], ["Yaz", "Sonbahar"], "Kale + nehir; yüksek plato havası", ["Kasvetli kış tek seçenek", "Belirsiz boş cadde"]],
  ["karaman", "Karaman", 70, "İç Anadolu", "Karaman Kalesi / Yunus Emre bağlamı sakin", ["Merkez eğitim aksı", "Taşkent yeşili uzak"], ["#C8102E", "#A16207", "#009488", "#F8FAFC"], ["İlkbahar", "Yaz"], "Tarihi başkent sakinliği; berrak ışık", ["Belirsiz endüstri bölgesi", "Toz fırtınası"]],
  ["kirikkale", "Kırıkkale", 71, "İç Anadolu", "Kızılırmak köprü aksı / kent silueti", ["Merkez eğitim aksı", "Yeşil koridor"], ["#C8102E", "#57534E", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Nehir + modern kent; eğitim ciddiyeti", ["Silah / savunma sanayi imgeleri", "Otoyol trafik"]],
  ["batman", "Batman", 72, "Güneydoğu", "Batman Çayı / modern kent aksı", ["Hasankeyf uzak (saygılı, güncel bağlam)", "Merkez eğitim koridoru"], ["#C8102E", "#1C1917", "#009488", "#F5F5F4"], ["İlkbahar", "Sonbahar"], "Modern Güneydoğu kenti; umutlu ışık", ["Petrol kulesi endüstri hero", "Çatışma imgeleri"]],
  ["sirnak", "Şırnak", 73, "Güneydoğu", "Cudi / Gabar dağ silueti (uzak, saygılı)", ["Merkez camii / eğitim aksı", "Yeşil vadi"], ["#C8102E", "#44403C", "#009488", "#E2E8F0"], ["Yaz", "İlkbahar"], "Dağ ölçeği; saygı; sakin yerleşim", ["Askeri / çatışma imgeleri", "Tehlikeli sınır macera"]],
  ["bartin", "Bartın", 74, "Karadeniz", "Bartın Çayı ve ahşap konaklar", ["Amasra kale uzak (opsiyonel)", "Merkez eğitim aksı"], ["#C8102E", "#166534", "#009488", "#FBF9FC"], ["Yaz", "İlkbahar"], "Nehir + ahşap; Karadeniz sakinliği", ["Amasra aşırı turist kalabalığı tek görsel", "Balık tezgâh close-up"]],
  ["ardahan", "Ardahan", 75, "Doğu", "Ardahan Kalesi ve plato", ["Çıldır Gölü uzak", "Merkez eğitim aksı"], ["#C8102E", "#334155", "#009488", "#E2E8F0"], ["Yaz"], "Yüksek plato ferahlığı; temiz hava", ["Donmuş kasvet tek seçenek", "Askeri estetik"]],
  ["igdir", "Iğdır", 76, "Doğu", "Ağrı Dağı uzaktan (Iğdır ovası)", ["Merkez eğitim aksı", "Kayısı / tarım mesafeli"], ["#C8102E", "#92400E", "#009488", "#F8FAFC"], ["Yaz", "İlkbahar"], "Ova + dağ; sınır ötesi ufuk saygılı", ["Sınır gerilimi", "Ürün close-up hero"]],
  ["yalova", "Yalova", 77, "Marmara", "Yalova sahil promenad / yeşil tepeler", ["Termal kampüs atmosferi", "Merkez eğitim aksı"], ["#C8102E", "#0F766E", "#009488", "#0F172A"], ["İlkbahar", "Sonbahar"], "Marmara sahil + yeşil; sakin", ["Termal otel broşürü abartısı", "İstanbul feribot kalabalık kaos"]],
  ["karabuk", "Karabük", 78, "Karadeniz", "Safranbolu UNESCO sokakları (mesafeli editorial)", ["Merkez eğitim aksı", "Yenice ormanları uzak"], ["#C8102E", "#9A3412", "#009488", "#FBF9FC"], ["İlkbahar", "Sonbahar"], "Ahşap Osmanlı dokusu; turizm abartısız", ["Çarşı hediyelik spam", "Kalabalık tur otobüsü"]],
  ["kilis", "Kilis", 79, "Güneydoğu", "Kilis taş sokak / camii silueti", ["Merkez eğitim aksı", "Zeytinlik mesafeli"], ["#C8102E", "#A16207", "#009488", "#F5F5F4"], ["İlkbahar", "Sonbahar"], "Sınır kenti sakinliği; taş sıcaklığı", ["Sınır gerilimi", "Savaş imgeleri"]],
  ["osmaniye", "Osmaniye", 80, "Akdeniz", "Osmaniye ovası ve dağ eteği", ["Karatepe-Aslantaş uzak", "Merkez eğitim aksı"], ["#C8102E", "#CA8A04", "#009488", "#F8FAFC"], ["İlkbahar", "Sonbahar"], "Akdeniz içi ova; berrak ışık", ["Belirsiz otoyol", "Sanayi close-up"]],
  ["duzce", "Düzce", 81, "Karadeniz", "Efteni Gölü / yeşil Düzce ovası", ["Merkez eğitim aksı", "Kaynaşlar mesafeli"], ["#C8102E", "#166534", "#009488", "#E2E8F0"], ["İlkbahar", "Yaz"], "Yeşil ova ferahlığı; umutlu sabah", ["Afet / enkaz görselleri", "Otoyol dinlenme tesisi"]],
].map(([slug, name, plate, region, hero, alts, palette, seasons, direction, forbidden]) => ({
  slug,
  name,
  plate,
  region,
  hero,
  alts,
  palette,
  seasons,
  direction,
  forbidden,
}));


function renderCity(c) {
  const alts = c.alts.map((a) => `- ${a}`).join("\n");
  const seasons = c.seasons.map((x) => `- ${x}`).join("\n");
  const forbidden = c.forbidden.map((x) => `- ${x}`).join("\n");
  const palette = c.palette
    .map((hex, i) => {
      const role = ["Brand red", "Regional accent / teal", "Support", "Ink / surface"][i] || "Support";
      return `| \`${hex}\` | ${role} |`;
    })
    .join("\n");

  return `# City Asset Spec — ${c.name}

| Field | Value |
| --- | --- |
| **Slug** | \`${c.slug}\` |
| **Plate** | ${c.plate} |
| **Region** | ${c.region} |
| **Status** | Spec approved for production (binaries pending) |
| **Kit** | Design Kit v1.0 |

---

## Hero landmark

${c.hero}

## Alternative landmarks

${alts}

## Recommended color palette

| Swatch | Role |
| --- | --- |
${palette}

Always retain EduAtlas Red \`#C8102E\` and Atlas Teal \`#009488\` as brand anchors.

## Preferred seasons

${seasons}

## Photography direction

${c.direction}

Follow global rules in \`VISUAL-REFERENCE.md\` (Photography Rules).

## Forbidden compositions

${forbidden}
- Floating promo stickers / badge overlays on hero media
- Scraped watermarked stock
- Faces of minors without releases

## Export targets

| Asset | Naming |
| --- | --- |
| Hero WEBP | \`ea-city-${c.slug}-hero-{sm|md|lg|xl}.webp\` |
| Card thumb | \`ea-city-${c.slug}-card-md.webp\` |
| Seasonal | \`ea-city-${c.slug}-hero-{season}-lg.webp\` |

## Dynamic Hero hooks

- City dropdown label: **${c.name}**
- Suggested searches: local districts + popular types
- Stats: localize when data quality allows

---

*Approved assets only — Cursor must not invent alternate landmarks.*
`;
}

if (cities.length !== 81) {
  console.error("Expected 81 cities, got", cities.length);
  process.exit(1);
}

for (const c of cities) {
  fs.writeFileSync(path.join(citiesDir, `${c.slug}.md`), renderCity(c), "utf8");
}

const indexRows = cities
  .map(
    (c) =>
      `| ${c.plate} | ${c.name} | \`${c.slug}\` | ${c.region} | [cities/${c.slug}.md](./cities/${c.slug}.md) |`,
  )
  .join("\n");

const index = `# EduAtlas City Assets Index

| Field | Value |
| --- | --- |
| **Count** | ${cities.length} provinces |
| **Kit** | Design Kit v1.0 |
| **Status** | Specifications complete; binaries pending approval |

## Critical rule

City hero photography must follow each city spec. Implementers may only use approved binaries named per \`DESIGN-KIT.md\`.

## Cities

| Plate | City | Slug | Region | Spec |
| --- | --- | --- | --- | --- |
${indexRows}

## Priority production order

1. Istanbul (national default)
2. Ankara, Izmir, Bursa, Antalya, Gaziantep
3. Remaining metropolitan hubs
4. All other provinces
`;

fs.writeFileSync(path.join(root, "CITIES-INDEX.md"), index, "utf8");
fs.writeFileSync(
  path.join(root, "README.md"),
  `# City Assets

Specifications for all **81** Turkish provinces.

- Index: [CITIES-INDEX.md](./CITIES-INDEX.md)
- Per-city specs: \`cities/{slug}.md\`
- Approved binaries (future): \`approved/\`
- Drafts: \`draft/\`

See \`VISUAL-REFERENCE.md\` (City Hero System) and \`DESIGN-KIT.md\`.
`,
  "utf8",
);

console.log("Wrote", cities.length, "city specs");
const rizeCity = cities.find((c) => c.slug === "rize");
console.log("rize name:", rizeCity && rizeCity.name);
