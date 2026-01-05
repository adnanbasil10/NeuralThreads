const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPortfolioItems() {
  try {
    console.log('🔍 Checking for portfolio items in database...\n');

    // Count total portfolio items
    const totalCount = await prisma.portfolioItem.count();
    console.log(`📊 Total Portfolio Items: ${totalCount}`);

    if (totalCount === 0) {
      console.log('\n⚠️ No portfolio items found in the database.');
      console.log('💡 Designers need to add portfolio items through their portfolio page.');
      
      // Check if there are any designers
      const designerCount = await prisma.designer.count();
      console.log(`\n👥 Total Designers: ${designerCount}`);
      
      if (designerCount > 0) {
        const designers = await prisma.designer.findMany({
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            portfolioItems: {
              select: {
                id: true,
              },
            },
          },
        });
        
        console.log('\n📋 Designers and their portfolio counts:');
        designers.forEach((designer) => {
          console.log(`  - ${designer.user.name} (${designer.user.email}): ${designer.portfolioItems.length} items`);
        });
      }
    } else {
      // Get sample items
      const sampleItems = await prisma.portfolioItem.findMany({
        take: 5,
        include: {
          designer: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('\n✅ Sample Portfolio Items:');
      sampleItems.forEach((item, index) => {
        console.log(`\n  ${index + 1}. ${item.description?.substring(0, 50) || 'No description'}`);
        console.log(`     Designer: ${item.designer.user.name}`);
        console.log(`     Category: ${item.category || 'N/A'}`);
        console.log(`     Price: ₹${item.budgetMin || 'N/A'} - ₹${item.budgetMax || 'N/A'}`);
        console.log(`     Has Image: ${item.imageUrl ? 'Yes' : 'No'}`);
      });

      // Count by category
      const byCategory = await prisma.portfolioItem.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
      });

      console.log('\n📊 Portfolio Items by Category:');
      byCategory.forEach((group) => {
        console.log(`  - ${group.category || 'No category'}: ${group._count.category} items`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking portfolio items:', error);
    if (error.message.includes('chatbotConversation') || error.message.includes('chatbotMessage')) {
      console.error('\n⚠️ Note: This error might be related to Prisma client not being regenerated.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkPortfolioItems();







