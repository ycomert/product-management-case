# Yazılım Geliştirici Değerlendirme Görevi

Merhaba,

Bizim İnternet Bilişim Teknolojileri'ne yapmış olduğunuz yazılım geliştirici başvurunuz kapsamında
teknik becerilerinizi değerlendirmek amacıyla aşağıdaki görevi tamamlamanızı rica ediyoruz. Bu görev,
**NestJS** çerçevesindeki yetkinliğinizi, kodlama standartlarına yaklaşımınızı, güvenlik bilincinizi,
veritabanı kullanımınızı ve dosya işleme yeteneklerinizi gözlemlememizi sağlayacaktır.

## Senaryo

Bir e-ticaret platformu için yeni bir **ürün katalog yönetimi ve sipariş işleme arka uç modülü**
geliştirmeniz gerekmektedir. Bu modül, ürünlerin listelenmesi, stok durumunun yönetimi ve müşteri
siparişlerinin işlenmesi gibi temel işlevleri içerecektir.

## Beklentiler ve Değerlendirme Kriterleri

- **NestJS Yetkinliği:**
    o Modüler yapıyı (modüller, servisler, kontrolörler) doğru kullanma.
    o **Dependency Injection (Bağımlılık Enjeksiyonu)** prensibini etkin şekilde uygulama.
    o Guard, Interceptor, Pipe gibi NestJS özelliklerinden uygun yerlerde faydalanma.
    o **TypeORM** veya **Mongoose** gibi bir ORM/ODM kullanarak veritabanı entegrasyonu
       sağlama.
- **Kod Standartları ve Temiz Kod:**
    o Okunabilir, sürdürülebilir ve iyi yorumlanmış kod yazımı.
    o Tek Sorumluluk Prensibi (SRP) gibi **SOLID** prensiplerine uyum.
    o Gereksiz karmaşıklıktan kaçınma, modüler ve ayrık yapı.
- **Kod Güvenliği:**
    o Yaygın güvenlik açıklarına ( **XSS, CSRF, SQL Injection** vb.) karşı önlemler alma (örneğin,
       girdi doğrulama, sanitizasyon).
    o Kimlik doğrulama ( **Authentication** ) ve yetkilendirme ( **Authorization** ) mekanizmalarını
       (örneğin, JWT kullanımıyla) doğru ve güvenli bir şekilde uygulama.
    o Hassas verilerin güvenli bir şekilde ele alınması.
- **Veritabanı Kullanımı ve Karmaşık Sorgular:**
    o Ürünler, Kategoriler, Kullanıcılar ve Siparişler gibi temel varlıkları içeren bir veritabanı
       şeması tasarlama.
    o **MySQL** veya **PostgreSQL** veritabanlarından birini seçerek uygulama.
    o Ürün filtreleme (fiyat aralığı, kategori, stok durumu) ve sipariş geçmişi görüntüleme gibi
       karmaşık sorguları optimize edilmiş şekilde yazma.
    o İşlem yönetimi (transaction management) kullanımı.
- **Dosya İşleme Yeteneği:**
    o Ürün görsellerinin sunucuya yüklenmesi ve saklanması (örneğin, **Multer** kütüphanesi
       veya eşdeğeri ile).
    o Opsiyonel olarak, CSV veya Excel formatında toplu ürün yükleme/indirme özelliği
       ekleme.


## Görev Detayları

Aşağıdaki temel **API uç noktalarını** geliştirmeniz beklenmektedir:

- /products: Ürünleri listeleme, yeni ürün ekleme, ürün güncelleme, ürün silme.
- /categories: Kategorileri yönetme.
- /orders: Sipariş oluşturma, sipariş durumunu güncelleme, sipariş geçmişini görüntüleme.
- /auth: Kullanıcı kaydı ve giriş işlemleri.
- /upload: Ürün görseli yükleme.
- /bulk-upload: (Opsiyonel) Toplu ürün yükleme (CSV/Excel).

## Kullanılacak Teknolojiler

- **Backend:** NestJS, TypeScript
- **Veritabanı:** MySQL veya PostgreSQL (Tercih size aittir)
- **Güvenlik:** Passport.js (JWT stratejisi)
- **Dosya Yükleme:** Multer (veya eşdeğeri)

## Teslim Edilecekler

- **Çalışır Durumda NestJS Projesi:** Tüm kaynak kodları içeren bir proje (örn. GitHub deposu linki).
- **Veritabanı Şeması/Modelleri:** Veritabanı yapısını gösteren ilgili dosyalar.
- **API Dokümantasyonu:** API uç noktalarını ve beklenen istek/cevap formatlarını açıklayan basit
    bir dokümantasyon ( **Swagger/OpenAPI** veya **Postman Collection** formatında olabilir).
- **Kurulum ve Çalıştırma Talimatları:** Projeyi yerel makinede nasıl kurup çalıştıracağınızı
    açıklayan detaylı bir README.md dosyası.
- **Opsiyonel Olarak Ön Yüz (Front-End) Desteği:** Yaptığınız çalışmayı görsel bir arayüzle
    desteklemek size bırakılmıştır. Şirketimizde **React.js** kullandığımızı belirtmek isteriz. Bu,
    projenizin kullanılabilirliğini ve entegrasyon yeteneğinizi göstermeniz için bir fırsattır.

Görevinizi tamamlarken, gerçek dünya projesi geliştiriyormuş gibi **kod kalitesine, performansa ve
güvenliğe** dikkat etmeniz önemlidir.

