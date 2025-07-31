# E-Commerce Backend API

Modern ve güvenli e-ticaret platformu için geliştirilmiş kapsamlı backend API servisi.

## 🚀 Özellikler

### 🔐 Kimlik Doğrulama ve Yetkilendirme
- JWT tabanlı authentication
- Role-based authorization (Admin/Customer)
- Güvenli password hashing (bcrypt)
- Refresh token desteği

### 📦 Ürün Yönetimi
- CRUD operasyonları
- Gelişmiş filtreleme ve arama
- Kategori bazlı organizasyon
- Stok takibi ve yönetimi
- Pagination ve sorting

### 🛒 Sipariş Yönetimi
- Sipariş oluşturma ve takibi
- Durum yönetimi (Pending → Confirmed → Shipped → Delivered)
- Transaction management
- Sipariş geçmişi
- Otomatik stok güncellemesi

### 📁 Dosya Yönetimi
- Ürün görseli yükleme
- CSV/Excel toplu ürün içe aktarma
- Güvenli dosya validasyonu
- Otomatik hata raporlama

### 🔒 Güvenlik
- Input sanitization (XSS, SQL Injection koruması)
- Rate limiting
- Security headers (CSP, HSTS, etc.)
- Request/Response logging
- Comprehensive error handling

## 🛠 Teknolojiler

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport.js + JWT
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **File Processing**: Multer, csv-parser, xlsx
- **Security**: Helmet, express-rate-limit, xss

## 📋 Gereksinimler

- Node.js (v18 veya üzeri)
- PostgreSQL (v12 veya üzeri)
- npm veya yarn

## ⚡ Hızlı Başlangıç

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd ecommerce-backend
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Değişkenlerini Ayarlayın

`.env` dosyasını oluşturun:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=ecommerce_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# Application
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Upload
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=5242880
```

### 4. Veritabanını Hazırlayın

PostgreSQL'de yeni bir veritabanı oluşturun:

```sql
CREATE DATABASE ecommerce_db;
```

### 5. Uygulamayı Başlatın

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Uygulama `http://localhost:3000` adresinde çalışmaya başlayacaktır.

## 📚 API Dokümantasyonu

### Swagger UI
API dokümantasyonuna şu adresten erişebilirsiniz:
```
http://localhost:3000/api
```

### Ana Endpoint'ler

#### 🔐 Authentication
- `POST /auth/register` - Kullanıcı kaydı
- `POST /auth/login` - Kullanıcı girişi

#### 👥 Users
- `GET /users/profile` - Kullanıcı profili (auth required)

#### 📂 Categories
- `GET /categories` - Tüm kategoriler
- `GET /categories/:id` - Kategori detayı
- `POST /categories` - Yeni kategori (admin only)
- `PATCH /categories/:id` - Kategori güncelleme (admin only)
- `DELETE /categories/:id` - Kategori silme (admin only)

#### 📦 Products
- `GET /products` - Ürün listesi (filtreleme, pagination)
- `GET /products/:id` - Ürün detayı
- `GET /products/category/:categoryId` - Kategoriye göre ürünler
- `GET /products/low-stock` - Düşük stok ürünleri (admin only)
- `POST /products` - Yeni ürün (admin only)
- `PATCH /products/:id` - Ürün güncelleme (admin only)
- `DELETE /products/:id` - Ürün silme (admin only)
- `PATCH /products/:id/stock/increase` - Stok artırma (admin only)
- `PATCH /products/:id/stock/decrease` - Stok azaltma (admin only)

#### 🛒 Orders
- `GET /orders` - Sipariş listesi (role-based filtering)
- `GET /orders/:id` - Sipariş detayı
- `GET /orders/history` - Kullanıcı sipariş geçmişi
- `GET /orders/stats` - Sipariş istatistikleri (admin only)
- `POST /orders` - Yeni sipariş
- `PATCH /orders/:id/status` - Sipariş durumu güncelleme (admin only)
- `PATCH /orders/:id/cancel` - Sipariş iptali

#### 📁 Upload
- `POST /upload/image` - Ürün görseli yükleme
- `POST /upload/bulk-products` - Toplu ürün yükleme (admin only)
- `GET /upload/template` - CSV şablonu indirme (admin only)

### Filtreleme Örnekleri

#### Ürün Filtreleme
```
GET /products?search=iPhone&categoryId=123&minPrice=100&maxPrice=1000&inStock=true&page=1&limit=10&sortBy=price&sortOrder=ASC
```

#### Sipariş Filtreleme
```
GET /orders?status=pending&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
```

## 🔒 Güvenlik Özellikleri

### Input Sanitization
- XSS protection using filterXSS
- SQL injection pattern detection
- NoSQL injection prevention
- Path traversal protection

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control
- Password strength validation
- Secure password hashing

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

### Rate Limiting
- Global: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- IP-based tracking

## 📁 Proje Yapısı

```
src/
├── common/                 # Ortak bileşenler
│   ├── config/            # Konfigürasyon dosyaları
│   ├── decorators/        # Custom decorator'lar
│   ├── enums/             # Enum tanımları
│   ├── filters/           # Exception filter'lar
│   ├── guards/            # Auth guard'lar
│   ├── interceptors/      # HTTP interceptor'lar
│   ├── middleware/        # Custom middleware'ler
│   ├── pipes/             # Validation pipe'lar
│   └── utils/             # Yardımcı fonksiyonlar
├── dto/                   # Data Transfer Objects
│   ├── auth/             # Auth DTO'ları
│   ├── category/         # Category DTO'ları
│   ├── order/            # Order DTO'ları
│   ├── product/          # Product DTO'ları
│   └── upload/           # Upload DTO'ları
├── entities/             # TypeORM entity'leri
├── modules/              # Ana modüller
│   ├── auth/            # Authentication modülü
│   ├── categories/      # Kategori yönetimi
│   ├── orders/          # Sipariş yönetimi
│   ├── products/        # Ürün yönetimi
│   ├── upload/          # Dosya yükleme
│   └── users/           # Kullanıcı yönetimi
├── app.module.ts        # Ana uygulama modülü
└── main.ts              # Uygulama giriş noktası
```

## 🧪 Test

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 CSV Toplu Yükleme

### CSV Formatı
```csv
name,description,price,stock,categoryName,imageUrl
iPhone 15 Pro,Latest iPhone model,999.99,50,Electronics,https://example.com/image.jpg
Samsung Galaxy S24,Android flagship,899.99,30,Electronics,https://example.com/image2.jpg
```

### Gerekli Alanlar
- `name`: Ürün adı
- `description`: Ürün açıklaması
- `price`: Fiyat (decimal)
- `stock`: Stok miktarı (integer)
- `categoryName`: Kategori adı (yoksa otomatik oluşturulur)
- `imageUrl`: Görsel URL'i (opsiyonel)

## 🔄 Sipariş Durumları

```
PENDING → CONFIRMED → SHIPPED → DELIVERED
    ↓         ↓
CANCELLED  CANCELLED
```

- **PENDING**: Yeni sipariş
- **CONFIRMED**: Onaylanmış sipariş
- **SHIPPED**: Kargoya verilmiş
- **DELIVERED**: Teslim edilmiş
- **CANCELLED**: İptal edilmiş

## 📝 Loglama

Uygulama kapsamlı loglama sistemi içerir:

- Request/Response logging
- Error tracking with correlation IDs
- Performance monitoring
- Security event logging

Log seviyeleri:
- `ERROR`: Kritik hatalar
- `WARN`: Uyarılar
- `INFO`: Genel bilgiler
- `DEBUG`: Geliştirme bilgileri

## 🚀 Production Deployment

### Environment Variables
Production ortamında aşağıdaki değişkenleri ayarlayın:

```env
NODE_ENV=production
JWT_SECRET=<strong-secret-key>
DATABASE_HOST=<production-db-host>
DATABASE_PASSWORD=<production-db-password>
BASE_URL=<production-url>
FRONTEND_URL=<frontend-url>
```

### Docker Deployment

```dockerfile
# Dockerfile örneği
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- Email: your-email@example.com
- GitHub: @your-username

## 🔗 Faydalı Linkler

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [Swagger Documentation](https://swagger.io/docs/)

---

💡 **İpucu**: API'yi test etmek için Swagger UI'ı kullanabilir veya Postman collection'ımızı import edebilirsiniz.