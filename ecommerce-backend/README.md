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
- Otomatik uploads klasörü oluşturma
- CSV template indirme ve toplu yükleme

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

# Admin Credentials (for testing)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
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
- `POST /auth/register` - Kullanıcı kaydı (role: customer | admin)
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

### Exception Handling
- Standardized HTTP exception handling using HttpStatus enum
- Comprehensive error responses with correlation IDs
- Automatic logging with severity levels
- Production-safe error messages

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
│   │   ├── multer.config.ts
│   │   └── security.config.ts
│   ├── decorators/        # Custom decorator'lar
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── entity/            # Base entity
│   │   └── base.entity.ts
│   ├── filters/           # Exception filter'lar
│   │   └── global-exception.filter.ts
│   ├── guards/            # Auth guard'lar
│   │   ├── jwt-auth.guard.ts
│   │   ├── local-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/      # HTTP interceptor'lar
│   │   ├── logging.interceptor.ts
│   │   └── response-transform.interceptor.ts
│   ├── middleware/        # Custom middleware'ler
│   │   └── sanitization.middleware.ts
│   ├── pipes/             # Validation pipe'lar
│   │   └── sanitization.pipe.ts
│   └── utils/             # Yardımcı fonksiyonlar
│       └── security.utils.ts
├── domain/                # Domain modülleri
│   ├── auth/             # Authentication
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── dto/          # Auth DTO'ları
│   │   └── strategies/   # Passport strategies
│   ├── categories/       # Kategori yönetimi
│   │   ├── category.controller.ts
│   │   ├── category.module.ts
│   │   ├── category.service.ts
│   │   ├── dto/          # Category DTO'ları
│   │   └── repository/   # Repository pattern
│   ├── orders/           # Sipariş yönetimi
│   │   ├── orders.controller.ts
│   │   ├── orders.module.ts
│   │   ├── orders.service.ts
│   │   ├── dto/          # Order DTO'ları
│   │   ├── enums/        # Order status enums
│   │   └── repository/   # Repository pattern
│   ├── products/         # Ürün yönetimi
│   │   ├── products.controller.ts
│   │   ├── products.module.ts
│   │   ├── products.service.ts
│   │   ├── dto/          # Product DTO'ları
│   │   └── repository/   # Repository pattern
│   ├── upload/           # Dosya yükleme
│   │   ├── upload.controller.ts
│   │   ├── upload.module.ts
│   │   ├── upload.service.ts
│   │   └── dto/          # Upload DTO'ları
│   └── users/            # Kullanıcı yönetimi
│       ├── users.controller.ts  # Users controller
│       ├── users.module.ts
│       ├── users.service.ts
│       ├── enums/        # User role enums
│       └── repository/   # Repository pattern
├── app.controller.ts      # Ana controller
├── app.module.ts         # Ana uygulama modülü
├── app.service.ts        # Ana service
└── main.ts               # Uygulama giriş noktası
```

## 🧪 Test

```bash
# API testleri için Postman collection kullanın
# postman_collection.json dosyasını import edin

# Swagger dokümantasyonu
# http://localhost:3000/api

# Manuel test için:
# 1. Register endpoint'i ile kullanıcı oluşturun
# 2. Login endpoint'i ile token alın
# 3. Diğer endpoint'leri test edin
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

## 🔧 API Kullanım Örnekleri

### Kullanıcı Kaydı
```bash
# Customer kaydı
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }'

# Admin kaydı
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

### Kullanıcı Girişi
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Profil Görüntüleme
```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## �� Sipariş Durumları

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

## 👤 Kullanıcı Rolleri

### Role Types
- **CUSTOMER**: Normal müşteri hesabı
- **ADMIN**: Yönetici hesabı (tam yetki)

### Admin Özellikleri
- Ürün yönetimi (CRUD)
- Kategori yönetimi (CRUD)
- Sipariş durumu güncelleme
- Sipariş istatistikleri görüntüleme
- Toplu ürün yükleme
- Düşük stok ürünleri görüntüleme

### Customer Özellikleri
- Profil görüntüleme
- Sipariş oluşturma
- Sipariş geçmişi görüntüleme
- Sipariş iptali

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

- Email: c8mert@gmail.com
- GitHub: @ycomert

## 🔗 Faydalı Linkler

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [Swagger Documentation](https://swagger.io/docs/)

---

💡 **İpucu**: API'yi test etmek için Swagger UI'ı kullanabilir veya Postman collection'ımızı import edebilirsiniz.

## 📋 Postman Collection

Proje ile birlikte gelen `postman_collection.json` dosyası ile API'yi kolayca test edebilirsiniz:

### Özellikler:
- ✅ Otomatik token yönetimi
- ✅ Admin ve Customer login endpoint'leri
- ✅ Tüm CRUD operasyonları
- ✅ File upload testleri
- ✅ Pre-configured variables

### Kullanım:
1. Postman'i açın
2. `postman_collection.json` dosyasını import edin
3. `Login (Admin)` endpoint'ini çalıştırın
4. Token otomatik kaydedilecek
5. Diğer endpoint'leri test edin

### Test Sırası:
```
1. Login (Admin) → Token al
2. Create Category (Admin) → Kategori oluştur
3. Create Product (Admin) → Ürün oluştur
4. Create Order → Sipariş oluştur
5. Upload Image → Resim yükle
```