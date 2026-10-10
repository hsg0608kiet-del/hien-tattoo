const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      id: 'customer-1',
      name: 'Nguyễn Văn Khách',
      email: 'customer1@example.com',
      role: 'CUSTOMER',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'admin-1',
      name: 'Admin Manager',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'artist1@example.com' },
    update: {},
    create: {
      id: 'artist-1',
      name: 'Hiển Artist',
      email: 'artist1@example.com',
      role: 'ARTIST',
      portfolioItems: {
        create: [
          {
            title: 'Rồng Châu Á - Kín Lưng',
            imageUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&q=80',
            style: 'Asian Traditional',
            placement: 'Lưng',
            isFlash: false
          },
          {
            title: 'Mẫu Hoa Hồng Nhỏ',
            imageUrl: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=800&q=80',
            style: 'Fine Line',
            placement: 'Cổ Tay',
            isFlash: true
          }
        ]
      }
    },
  })

  console.log('Seed data successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
