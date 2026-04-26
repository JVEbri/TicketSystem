import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log('Users count:', count);
  
  if (count > 0) {
    await prisma.user.deleteMany();
    console.log('Deleted all users');
  } else {
    console.log('No users to delete');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());