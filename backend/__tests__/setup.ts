import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  try {
    await prisma.$connect();
    
    // Reset database schema
    execSync('npx prisma db push --force-reset', { 
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Failed to setup test database:', error);
  }
});

afterAll(async () => {
  // Cleanup
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to disconnect from database:', error);
  }
});

beforeEach(async () => {
  // Clean up data before each test
  const deleteOrder = [
    'Follow',
    'Like',
    'Comment',
    'Post',
    'Conversation',
    'Message',
    'Notification',
    'AIAgent',
    'UserProfile',
    'User'
  ];
  
  for (const model of deleteOrder) {
    await (prisma as any)[model.toLowerCase()].deleteMany();
  }
});
