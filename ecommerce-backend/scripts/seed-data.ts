import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { UsersService } from '../src/modules/users/users.service';
import { ProductsService } from '../src/modules/products/products.service';
import { UserRole } from '../src/common/enums/user-role.enum';
import { Category } from '../src/entities/category.entity';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const categoriesService = app.get(CategoriesService);
  const usersService = app.get(UsersService);
  const productsService = app.get(ProductsService);

  try {
    // Create categories
    console.log('📂 Creating categories...');
    const categories: Category[] = [];
    
    const categoryData = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Fashion and clothing items' },
      { name: 'Books', description: 'Books and educational materials' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports', description: 'Sports equipment and accessories' },
    ];

    for (const categoryInfo of categoryData) {
      try {
        const category = await categoriesService.create(categoryInfo);
        categories.push(category);
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        console.log(`⚠️  Category '${categoryInfo.name}' might already exist`);
      }
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    try {
      await usersService.create({
        email: 'admin@ecommerce.com',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
      });
      console.log('✅ Created admin user: admin@ecommerce.com');
    } catch (error) {
      console.log('⚠️  Admin user might already exist');
    }

    // Create sample user
    console.log('👥 Creating sample customer...');
    try {
      await usersService.create({
        email: 'customer@example.com',
        password: 'Customer123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      console.log('✅ Created customer user: customer@example.com');
    } catch (error) {
      console.log('⚠️  Customer user might already exist');
    }

    // Create sample products
    console.log('📦 Creating sample products...');
    const sampleProducts = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced camera and A17 Pro chip',
        price: 999.99,
        stock: 50,
        categoryName: 'Electronics',
        imageUrl: 'https://example.com/iphone15pro.jpg'
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Premium Android smartphone with AI features',
        price: 899.99,
        stock: 30,
        categoryName: 'Electronics',
        imageUrl: 'https://example.com/galaxys24.jpg'
      },
      {
        name: 'MacBook Air M3',
        description: 'Ultra-thin laptop with M3 chip and all-day battery',
        price: 1299.99,
        stock: 25,
        categoryName: 'Electronics',
        imageUrl: 'https://example.com/macbookair.jpg'
      },
      {
        name: 'Nike Air Max 270',
        description: 'Comfortable running shoes with Max Air cushioning',
        price: 150.00,
        stock: 100,
        categoryName: 'Sports',
        imageUrl: 'https://example.com/nikeairmax.jpg'
      },
      {
        name: 'Levi\'s 501 Jeans',
        description: 'Classic straight-fit jeans in premium denim',
        price: 89.99,
        stock: 75,
        categoryName: 'Clothing',
        imageUrl: 'https://example.com/levis501.jpg'
      },
      {
        name: 'The Pragmatic Programmer',
        description: 'Essential guide for software developers',
        price: 45.99,
        stock: 40,
        categoryName: 'Books',
        imageUrl: 'https://example.com/pragmatic.jpg'
      },
      {
        name: 'Dyson V15 Detect',
        description: 'Cordless vacuum with laser dust detection',
        price: 649.99,
        stock: 15,
        categoryName: 'Home & Garden',
        imageUrl: 'https://example.com/dysonv15.jpg'
      },
      {
        name: 'Instant Pot Duo 7-in-1',
        description: 'Multi-use pressure cooker and slow cooker',
        price: 99.99,
        stock: 60,
        categoryName: 'Home & Garden',
        imageUrl: 'https://example.com/instantpot.jpg'
      }
    ];

    for (const productData of sampleProducts) {
      try {
        // Find category by name
        const category = categories.find(c => c.name === productData.categoryName);
        if (category) {
          const { categoryName, ...productInfo } = productData;
          await productsService.create({
            ...productInfo,
            categoryId: category.id,
          });
          console.log(`✅ Created product: ${productData.name}`);
        }
      } catch (error) {
        console.log(`⚠️  Product '${productData.name}' might already exist`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Sample Login Credentials:');
    console.log('Admin: admin@ecommerce.com / Admin123!');
    console.log('Customer: customer@example.com / Customer123!');
    console.log('');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await app.close();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});