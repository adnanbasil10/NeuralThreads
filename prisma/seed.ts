import { PrismaClient, UserRole, Location, Gender, BodyShape, Language, DesignNiche, WardrobeCategory, PortfolioCategory, AlterationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper to get random items from array
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper to get random item from array
function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate random number in range
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Unsplash fashion image URLs
const fashionImages = {
  bridal: [
    'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
  ],
  casual: [
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
    'https://images.unsplash.com/photo-1485968579169-a6b4c5f5a53f?w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
  ],
  ethnic: [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800',
    'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800',
    'https://images.unsplash.com/photo-1604344257263-a7a987b5d0ca?w=800',
    'https://images.unsplash.com/photo-1596942517067-59ecf01be4e3?w=800',
  ],
  fusion: [
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800',
  ],
  contemporary: [
    'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800',
    'https://images.unsplash.com/photo-1475180098004-ca77a66827be?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1544957992-20514f595d6f?w=800',
    'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=800',
  ],
  alterations: [
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800',
    'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800',
  ],
  wardrobe: {
    UPPERWEAR: [
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800',
      'https://images.unsplash.com/photo-1603251579431-8041402bdeda?w=800',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
    ],
    BOTTOMWEAR: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
    ],
    SHOES: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
    ],
    ACCESSORIES: [
      'https://images.unsplash.com/photo-1611923134239-b9be5816e23e?w=800',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    ],
    OUTERWEAR: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800',
    ],
    BAG: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    ],
    JACKET: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800',
      'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800',
    ],
    DRESS: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800',
    ],
  },
  profiles: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
  ],
};

// Customer data
const customerData = [
  { name: 'Kavya Sharma', age: 28, gender: Gender.FEMALE, location: Location.MG_ROAD, bodyShape: BodyShape.HOURGLASS, language: Language.HINDI, budgetMin: 10000, budgetMax: 25000, styles: ['Ethnic', 'Fusion', 'Casual'] },
  { name: 'Arjun Nair', age: 32, gender: Gender.MALE, location: Location.COMMERCIAL_STREET, bodyShape: BodyShape.RECTANGLE, language: Language.ENGLISH, budgetMin: 25000, budgetMax: 50000, styles: ['Formal', 'Contemporary', 'Western'] },
  { name: 'Priya Reddy', age: 24, gender: Gender.FEMALE, location: Location.MG_ROAD, bodyShape: BodyShape.PEAR, language: Language.TELUGU, budgetMin: 5000, budgetMax: 10000, styles: ['Casual', 'Bohemian', 'Streetwear'] },
  { name: 'Vikram Malhotra', age: 35, gender: Gender.MALE, location: Location.COMMERCIAL_STREET, bodyShape: BodyShape.RECTANGLE, language: Language.HINDI, budgetMin: 50000, budgetMax: 100000, styles: ['Formal', 'Ethnic', 'Contemporary'] },
  { name: 'Sneha Iyer', age: 26, gender: Gender.FEMALE, location: Location.MG_ROAD, bodyShape: BodyShape.HOURGLASS, language: Language.TAMIL, budgetMin: 15000, budgetMax: 30000, styles: ['Ethnic', 'Traditional', 'Fusion'] },
  { name: 'Rahul Gupta', age: 29, gender: Gender.MALE, location: Location.COMMERCIAL_STREET, bodyShape: BodyShape.RECTANGLE, language: Language.ENGLISH, budgetMin: 20000, budgetMax: 40000, styles: ['Casual', 'Western', 'Minimalist'] },
  { name: 'Anita Desai', age: 42, gender: Gender.FEMALE, location: Location.MG_ROAD, bodyShape: BodyShape.PEAR, language: Language.KANNADA, budgetMin: 30000, budgetMax: 60000, styles: ['Ethnic', 'Formal', 'Traditional'] },
  { name: 'Karthik Menon', age: 31, gender: Gender.MALE, location: Location.COMMERCIAL_STREET, bodyShape: BodyShape.RECTANGLE, language: Language.ENGLISH, budgetMin: 10000, budgetMax: 20000, styles: ['Casual', 'Streetwear', 'Contemporary'] },
  { name: 'Divya Krishnan', age: 27, gender: Gender.FEMALE, location: Location.MG_ROAD, bodyShape: BodyShape.HOURGLASS, language: Language.TAMIL, budgetMin: 40000, budgetMax: 80000, styles: ['Bridal', 'Ethnic', 'Fusion'] },
  { name: 'Aditya Patel', age: 33, gender: Gender.MALE, location: Location.COMMERCIAL_STREET, bodyShape: BodyShape.RECTANGLE, language: Language.HINDI, budgetMin: 15000, budgetMax: 35000, styles: ['Formal', 'Western', 'Contemporary'] },
];

// Designer data
const designerData = [
  {
    name: 'Priya Mehta',
    age: 35,
    location: Location.MG_ROAD,
    yearsExperience: 12,
    niches: [DesignNiche.BRIDAL, DesignNiche.ETHNIC],
    bio: 'Award-winning bridal couture designer with over a decade of experience. Specializing in traditional Indian bridal wear with contemporary touches. My designs have been featured in Vogue India and Elle.',
    languages: [Language.ENGLISH, Language.HINDI, Language.KANNADA],
    phone: '+91 98765 43210',
    email: 'priya.mehta@neuralthreads.com',
  },
  {
    name: 'Arjun Reddy',
    age: 30,
    location: Location.COMMERCIAL_STREET,
    yearsExperience: 8,
    niches: [DesignNiche.CASUAL, DesignNiche.WESTERN],
    bio: 'Contemporary fashion designer focusing on comfortable yet stylish everyday wear. I believe fashion should be accessible and practical without compromising on aesthetics.',
    languages: [Language.ENGLISH, Language.TELUGU, Language.HINDI],
    phone: '+91 98765 43211',
    email: 'arjun.reddy@neuralthreads.com',
  },
  {
    name: 'Ananya Singh',
    age: 28,
    location: Location.MG_ROAD,
    yearsExperience: 6,
    niches: [DesignNiche.FUSION, DesignNiche.WESTERN],
    bio: 'Fusion wear specialist blending Eastern aesthetics with Western silhouettes. London School of Fashion graduate passionate about sustainable fashion.',
    languages: [Language.ENGLISH, Language.HINDI],
    phone: '+91 98765 43212',
    email: 'ananya.singh@neuralthreads.com',
  },
  {
    name: 'Rohan Kumar',
    age: 42,
    location: Location.COMMERCIAL_STREET,
    yearsExperience: 18,
    niches: [DesignNiche.FORMAL, DesignNiche.ETHNIC],
    bio: 'Master tailor and formal wear designer with expertise in bespoke suits and traditional sherwanis. Trained under legendary designers in Milan and Jaipur.',
    languages: [Language.ENGLISH, Language.HINDI, Language.KANNADA],
    phone: '+91 98765 43213',
    email: 'rohan.kumar@neuralthreads.com',
  },
  {
    name: 'Sneha Patel',
    age: 32,
    location: Location.MG_ROAD,
    yearsExperience: 10,
    niches: [DesignNiche.ETHNIC, DesignNiche.BRIDAL],
    bio: 'Specializing in Gujarati and South Indian bridal traditions. Every piece I create tells a story of cultural heritage and modern elegance.',
    languages: [Language.ENGLISH, Language.HINDI, Language.TAMIL],
    phone: '+91 98765 43214',
    email: 'sneha.patel@neuralthreads.com',
  },
  {
    name: 'Vikram Choudhary',
    age: 38,
    location: Location.COMMERCIAL_STREET,
    yearsExperience: 14,
    niches: [DesignNiche.CASUAL, DesignNiche.WESTERN],
    bio: 'Urban streetwear and casual fashion designer. My designs are inspired by global street fashion trends adapted for the Indian context.',
    languages: [Language.ENGLISH, Language.HINDI],
    phone: '+91 98765 43215',
    email: 'vikram.choudhary@neuralthreads.com',
  },
  {
    name: 'Meera Krishnamurthy',
    age: 45,
    location: Location.MG_ROAD,
    yearsExperience: 20,
    niches: [DesignNiche.BRIDAL, DesignNiche.ETHNIC],
    bio: 'Pioneer in South Indian bridal couture. Known for intricate Kanjivaram-inspired designs and temple jewelry integration. National Award recipient.',
    languages: [Language.ENGLISH, Language.TAMIL, Language.KANNADA],
    phone: '+91 98765 43216',
    email: 'meera.k@neuralthreads.com',
  },
  {
    name: 'Aditya Sharma',
    age: 29,
    location: Location.COMMERCIAL_STREET,
    yearsExperience: 5,
    niches: [DesignNiche.WESTERN, DesignNiche.FUSION],
    bio: 'Young designer bringing fresh perspectives to Indian fashion. NIFT graduate with internship experience at major fashion houses.',
    languages: [Language.ENGLISH, Language.HINDI, Language.TELUGU],
    phone: '+91 98765 43217',
    email: 'aditya.sharma@neuralthreads.com',
  },
  {
    name: 'Lakshmi Venkatesh',
    age: 36,
    location: Location.MG_ROAD,
    yearsExperience: 11,
    niches: [DesignNiche.ETHNIC, DesignNiche.FORMAL],
    bio: 'Corporate ethnic wear specialist. Designing power dressing options that blend traditional elements with boardroom aesthetics.',
    languages: [Language.ENGLISH, Language.KANNADA, Language.TAMIL],
    phone: '+91 98765 43218',
    email: 'lakshmi.v@neuralthreads.com',
  },
  {
    name: 'Farhan Ahmed',
    age: 34,
    location: Location.COMMERCIAL_STREET,
    yearsExperience: 9,
    niches: [DesignNiche.CASUAL, DesignNiche.WESTERN],
    bio: 'Sustainable fashion advocate creating eco-friendly casual wear. Using organic fabrics and ethical production methods.',
    languages: [Language.ENGLISH, Language.HINDI, Language.KANNADA],
    phone: '+91 98765 43219',
    email: 'farhan.ahmed@neuralthreads.com',
  },
  {
    name: 'Nandini Rao',
    age: 40,
    location: Location.MG_ROAD,
    yearsExperience: 16,
    niches: [DesignNiche.FUSION, DesignNiche.ETHNIC],
    bio: 'Indo-Western fusion specialist known for innovative silhouettes. My designs grace red carpets and destination weddings worldwide.',
    languages: [Language.ENGLISH, Language.TELUGU, Language.HINDI],
    phone: '+91 98765 43220',
    email: 'nandini.rao@neuralthreads.com',
  },
  {
    name: 'Sameer Kapoor',
    age: 31,
    location: Location.COMMERCIAL_STREET,
    yearsExperience: 7,
    niches: [DesignNiche.WESTERN, DesignNiche.CASUAL],
    bio: 'Minimalist designer focusing on clean lines and quality fabrics. Less is more - creating timeless pieces that transcend seasons.',
    languages: [Language.ENGLISH, Language.HINDI],
    phone: '+91 98765 43221',
    email: 'sameer.kapoor@neuralthreads.com',
  },
  {
    name: 'Deepika Hegde',
    age: 33,
    location: Location.MG_ROAD,
    yearsExperience: 8,
    niches: [DesignNiche.ETHNIC, DesignNiche.BRIDAL],
    bio: 'Preserving Karnataka\'s textile heritage through modern interpretations. Specializing in Mysore silk and Ilkal saree designs.',
    languages: [Language.KANNADA, Language.ENGLISH, Language.HINDI],
    phone: '+91 98765 43222',
    email: 'deepika.hegde@neuralthreads.com',
  },
  {
    name: 'Rajesh Menon',
    age: 48,
    location: Location.COMMERCIAL_STREET,
    yearsExperience: 22,
    niches: [DesignNiche.FORMAL, DesignNiche.ETHNIC],
    bio: 'Veteran designer with expertise in men\'s formal and ceremonial wear. Trusted by politicians, celebrities, and business leaders.',
    languages: [Language.ENGLISH, Language.HINDI, Language.TAMIL],
    phone: '+91 98765 43223',
    email: 'rajesh.menon@neuralthreads.com',
  },
  {
    name: 'Ishita Banerjee',
    age: 27,
    location: Location.MG_ROAD,
    yearsExperience: 4,
    niches: [DesignNiche.WESTERN, DesignNiche.CASUAL],
    bio: 'Gen-Z designer creating Instagram-worthy fashion. Viral designs that blend comfort with statement-making aesthetics.',
    languages: [Language.ENGLISH, Language.HINDI, Language.KANNADA],
    phone: '+91 98765 43224',
    email: 'ishita.banerjee@neuralthreads.com',
  },
];

// Tailor data
const tailorData = [
  {
    name: 'Ramesh Kumar',
    age: 52,
    location: Location.MG_ROAD,
    latitude: 12.9716,
    longitude: 77.5946,
    yearsExperience: 28,
    skills: ['Alterations', 'Custom Fitting', 'Bridal Work', 'Ethnic Wear'],
    phone: '+91 98765 11111',
    email: 'ramesh.tailor@gmail.com',
  },
  {
    name: 'Lakshmi Devi',
    age: 45,
    location: Location.COMMERCIAL_STREET,
    latitude: 12.9833,
    longitude: 77.6089,
    yearsExperience: 22,
    skills: ['Embroidery', 'Stitching', 'Ethnic Wear', 'Bridal Work'],
    phone: '+91 98765 11112',
    email: 'lakshmi.alterations@gmail.com',
  },
  {
    name: 'Vijay Stitching Works',
    age: 38,
    location: Location.MG_ROAD,
    latitude: 12.9720,
    longitude: 77.5950,
    yearsExperience: 15,
    skills: ['Western Wear', 'Alterations', 'Button Work', 'Zipper Repair'],
    phone: '+91 98765 11113',
    email: 'vijay.stitching@gmail.com',
  },
  {
    name: 'Fatima Begum',
    age: 55,
    location: Location.COMMERCIAL_STREET,
    latitude: 12.9830,
    longitude: 77.6085,
    yearsExperience: 30,
    skills: ['Embroidery', 'Bridal Work', 'Ethnic Wear', 'Hand Stitching'],
    phone: '+91 98765 11114',
    email: 'fatima.embroidery@gmail.com',
  },
  {
    name: 'Suresh Tailors',
    age: 42,
    location: Location.MG_ROAD,
    latitude: 12.9712,
    longitude: 77.5942,
    yearsExperience: 18,
    skills: ['Custom Fitting', 'Alterations', 'Hemming', 'Western Wear'],
    phone: '+91 98765 11115',
    email: 'suresh.tailors@gmail.com',
  },
  {
    name: 'Gowri Alterations',
    age: 48,
    location: Location.COMMERCIAL_STREET,
    latitude: 12.9835,
    longitude: 77.6092,
    yearsExperience: 25,
    skills: ['Alterations', 'Stitching', 'Hemming', 'Button Work'],
    phone: '+91 98765 11116',
    email: 'gowri.alterations@gmail.com',
  },
  {
    name: 'Mohammed Tailor',
    age: 35,
    location: Location.MG_ROAD,
    latitude: 12.9718,
    longitude: 77.5948,
    yearsExperience: 12,
    skills: ['Ethnic Wear', 'Custom Fitting', 'Alterations', 'Zipper Repair'],
    phone: '+91 98765 11117',
    email: 'mohammed.tailor@gmail.com',
  },
  {
    name: 'Prema Stitching Center',
    age: 50,
    location: Location.COMMERCIAL_STREET,
    latitude: 12.9828,
    longitude: 77.6082,
    yearsExperience: 27,
    skills: ['Stitching', 'Embroidery', 'Ethnic Wear', 'Bridal Work'],
    phone: '+91 98765 11118',
    email: 'prema.stitching@gmail.com',
  },
  {
    name: 'Rajan Master Tailor',
    age: 58,
    location: Location.MG_ROAD,
    latitude: 12.9714,
    longitude: 77.5944,
    yearsExperience: 35,
    skills: ['Custom Fitting', 'Alterations', 'Western Wear', 'Formal Wear'],
    phone: '+91 98765 11119',
    email: 'rajan.master@gmail.com',
  },
  {
    name: 'Asha Fashion Tailoring',
    age: 40,
    location: Location.COMMERCIAL_STREET,
    latitude: 12.9832,
    longitude: 77.6087,
    yearsExperience: 16,
    skills: ['Alterations', 'Stitching', 'Western Wear', 'Hemming'],
    phone: '+91 98765 11120',
    email: 'asha.fashion@gmail.com',
  },
];

// Portfolio item descriptions by category
const portfolioDescriptions = {
  bridal: [
    'Exquisite red Banarasi silk lehenga with intricate gold zari work and kundan embellishments. Perfect for traditional North Indian weddings.',
    'Elegant ivory and gold bridal saree with hand-embroidered motifs and pearl detailing. A timeless piece for the modern bride.',
    'Contemporary pastel pink lehenga with 3D floral appliqué and Swarovski crystals. Ideal for day weddings and receptions.',
    'Royal blue velvet sherwani with silver thread work and matching dupatta. Designed for the discerning groom.',
    'Champagne gold reception gown with cape sleeves and cathedral train. Indo-Western fusion at its finest.',
  ],
  casual: [
    'Breezy cotton kurta in earthy tones with hand-block printed patterns. Perfect for casual outings and weekend brunches.',
    'Relaxed fit linen pants with subtle pleats and comfortable elastic waistband. Pairs well with any casual top.',
    'Bohemian-inspired maxi dress with floral prints and adjustable straps. Effortlessly stylish for summer days.',
    'Classic denim jacket with customized embroidery patches. A versatile layering piece for all seasons.',
    'Comfortable palazzo pants in vibrant prints with matching crop top. Easy-going style for everyday wear.',
  ],
  ethnic: [
    'Hand-woven Chanderi silk saree with traditional motifs in contemporary colors. Perfect for festive occasions.',
    'Anarkali suit in rich jewel tones with mirror work and gota patti border. Elegant ethnic wear for celebrations.',
    'Patola silk dupatta with geometric patterns paired with solid kurta. A statement piece rooted in heritage.',
    'Kalamkari printed kurta with palazzo pants and dupatta set. Artistic ethnic wear for the culture enthusiast.',
    'Lucknowi chikankari kurta in pristine white with delicate hand embroidery. Timeless elegance for any occasion.',
  ],
  fusion: [
    'Saree gown with pre-draped pallu and structured bodice. Modern interpretation of traditional draping.',
    'Indo-Western cape jacket over dhoti pants ensemble. Bold fusion for the fashion-forward individual.',
    'Crop top lehenga with contemporary prints and traditional embroidery techniques. Best of both worlds.',
    'Shirt dress with asymmetric hem and ethnic print panels. Office to evening transition piece.',
    'Palazzo suit with jacket overlay featuring traditional motifs. Fusion wear for the modern professional.',
  ],
  contemporary: [
    'Structured blazer dress with architectural details and clean lines. Power dressing redefined.',
    'Minimalist jumpsuit in neutral tones with subtle draping. Sophisticated simplicity for formal events.',
    'Geometric print co-ord set with modern silhouettes. Contemporary fashion for the trendsetter.',
    'Deconstructed saree with innovative draping and modern blouse design. Fashion-forward ethnic wear.',
    'Layered dress with asymmetric hemline and mixed textures. Statement piece for fashion events.',
  ],
};

// Sample work descriptions
const sampleWorkDescriptions = [
  'Precision hemming on silk saree - maintained original fall and drape while adjusting length.',
  'Complete blouse alteration with new padding and hook placement. Perfect fit achieved.',
  'Zipper replacement on designer dress with invisible zipper technique.',
  'Lehenga waist adjustment with concealed alterations preserving original embroidery.',
  'Sherwani shoulder restructuring and sleeve length modification.',
  'Intricate embroidery repair on vintage Kanjeevaram saree.',
  'Western dress taking in at waist and bust for better silhouette.',
  'Kurta collar style conversion from Nehru to Mandarin.',
  'Palazzo pants hemming with original border reattachment.',
  'Bridal lehenga can-can adjustment for perfect flare.',
  'Button replacement and buttonhole repair on formal jacket.',
  'Dupatta border attachment with matching thread work.',
  'Dress extension with fabric matching and seamless integration.',
  'Anarkali suit fitting adjustments at multiple points.',
  'Saree fall stitching with fabric strengthening.',
  'Formal trouser tapering with original hem preservation.',
  'Blouse back design modification from hooks to zipper.',
  'Kurta length adjustment maintaining embroidery placement.',
  'Evening gown bust alteration with boning adjustment.',
  'Traditional dhoti stitching with pleating precision.',
];

// Chat message templates
const chatMessages = [
  // Conversation 1: Bridal inquiry
  [
    { isDesigner: false, content: 'Hi, I\'m looking for a bridal lehenga for my wedding in December. Do you have availability?' },
    { isDesigner: true, content: 'Hello! Congratulations on your upcoming wedding! 🎉 Yes, I do have availability for December weddings. Could you tell me more about your vision?' },
    { isDesigner: false, content: 'I want something traditional but not too heavy. My colors are red and gold.' },
    { isDesigner: true, content: 'Perfect choice! I specialize in lightweight bridal lehengas with intricate detailing. Would you prefer silk or georgette base fabric?' },
    { isDesigner: false, content: 'Silk would be lovely. What\'s your typical budget range for bridal wear?' },
    { isDesigner: true, content: 'For bridal lehengas, my range is ₹45,000 to ₹1,50,000 depending on the work. Shall I share some of my recent bridal collections?' },
    { isDesigner: false, content: 'Yes please! That would be very helpful.' },
    { isDesigner: true, content: 'I\'ll send you some images from my portfolio. When would you like to schedule a consultation at my studio?' },
  ],
  // Conversation 2: Casual wear
  [
    { isDesigner: false, content: 'Hey! Love your casual collection. Looking for some everyday kurtas.' },
    { isDesigner: true, content: 'Thank you! I\'d be happy to help. Are you looking for cotton kurtas or something in linen?' },
    { isDesigner: false, content: 'Cotton mostly. Something comfortable for office wear.' },
    { isDesigner: true, content: 'Great! I have a lovely collection of cotton kurtas with subtle prints. Very office-appropriate. Budget range?' },
    { isDesigner: false, content: 'Around 2000-3000 per piece. Need about 5-6 kurtas.' },
    { isDesigner: true, content: 'Perfect! For bulk orders, I can offer a 15% discount. Would you like to visit my studio to see the fabric options?' },
  ],
  // Conversation 3: Fusion wear
  [
    { isDesigner: false, content: 'I have a reception party next month. Need something Indo-Western.' },
    { isDesigner: true, content: 'Exciting! Indo-Western is my specialty. What\'s the dress code - formal or semi-formal?' },
    { isDesigner: false, content: 'Semi-formal. I was thinking a saree gown or something similar.' },
    { isDesigner: true, content: 'A saree gown would be stunning! I can create one with pre-draped pallu for easy wearing. Any color preferences?' },
    { isDesigner: false, content: 'I love pastels. Maybe blush pink or mint green?' },
    { isDesigner: true, content: 'Both colors are trending this season! Let me share some design sketches with you.' },
    { isDesigner: false, content: 'That would be amazing. Thank you!' },
  ],
  // Conversation 4: Men's formal
  [
    { isDesigner: false, content: 'Need a sherwani for my engagement ceremony. Can you help?' },
    { isDesigner: true, content: 'Absolutely! Engagement sherwanis are one of my specialties. When is the ceremony?' },
    { isDesigner: false, content: 'In 6 weeks. Is that enough time?' },
    { isDesigner: true, content: 'Yes, that\'s perfect for a custom piece. Do you have any style preferences - classic, contemporary, or fusion?' },
    { isDesigner: false, content: 'Something classic but not too heavy. Navy blue or maroon.' },
    { isDesigner: true, content: 'Excellent choices! Navy with silver or maroon with gold work would look stunning. Let\'s schedule a measurement session.' },
  ],
  // Conversation 5: Ethnic alterations inquiry
  [
    { isDesigner: false, content: 'Hi, I bought a lehenga online but it doesn\'t fit well. Can you alter it?' },
    { isDesigner: true, content: 'Hello! I understand the frustration with online purchases. What specific alterations do you need?' },
    { isDesigner: false, content: 'The blouse is too loose and the lehenga waist needs taking in.' },
    { isDesigner: true, content: 'Both are common adjustments. Could you share a photo of the current fit? That will help me assess the work needed.' },
    { isDesigner: false, content: 'Sure, I\'ll send pictures tomorrow. How much do alterations usually cost?' },
    { isDesigner: true, content: 'Lehenga alterations typically range from ₹1,500 to ₹4,000 depending on the complexity. I\'ll give you an exact quote after seeing the garment.' },
  ],
];

// Wardrobe items data
const wardrobeItemsData = [
  { category: WardrobeCategory.UPPERWEAR, color: 'White', description: 'Classic white cotton shirt' },
  { category: WardrobeCategory.UPPERWEAR, color: 'Blue', description: 'Navy blue formal blazer' },
  { category: WardrobeCategory.UPPERWEAR, color: 'Red', description: 'Maroon ethnic kurta' },
  { category: WardrobeCategory.BOTTOMWEAR, color: 'Black', description: 'Black formal trousers' },
  { category: WardrobeCategory.BOTTOMWEAR, color: 'Blue', description: 'Denim jeans' },
  { category: WardrobeCategory.BOTTOMWEAR, color: 'Beige', description: 'Beige cotton pants' },
  { category: WardrobeCategory.SHOES, color: 'Brown', description: 'Brown leather shoes' },
  { category: WardrobeCategory.SHOES, color: 'White', description: 'White sneakers' },
  { category: WardrobeCategory.ACCESSORIES, color: 'Gold', description: 'Gold chain necklace' },
  { category: WardrobeCategory.ACCESSORIES, color: 'Black', description: 'Black leather belt' },
  { category: WardrobeCategory.OUTERWEAR, color: 'Grey', description: 'Grey wool coat' },
  { category: WardrobeCategory.OUTERWEAR, color: 'Brown', description: 'Brown leather jacket' },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.alterationRequest.deleteMany();
  await prisma.wardrobeItem.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.sampleWork.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.designer.deleteMany();
  await prisma.tailor.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleared existing data\n');

  const hashedPassword = await hashPassword('Password123!');

  // Create Customers
  console.log('👥 Creating customers...');
  const customers: any[] = [];
  for (let i = 0; i < customerData.length; i++) {
    const data = customerData[i];
    const user = await prisma.user.create({
      data: {
        email: `customer${i + 1}@neuralthreads.com`,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
        name: data.name,
        age: data.age,
        isEmailVerified: true,
        customer: {
          create: {
            gender: data.gender,
            location: data.location,
            stylePreferences: data.styles,
            bodyShape: data.bodyShape,
            languagePreference: data.language,
            budgetMin: data.budgetMin,
            budgetMax: data.budgetMax,
          },
        },
      },
      include: { customer: true },
    });
    customers.push(user);
    console.log(`  ✓ Created customer: ${data.name}`);
  }
  console.log(`✅ Created ${customers.length} customers\n`);

  // Create Designers
  console.log('🎨 Creating designers...');
  const designers: any[] = [];
  for (let i = 0; i < designerData.length; i++) {
    const data = designerData[i];
    const user = await prisma.user.create({
      data: {
        email: `designer${i + 1}@neuralthreads.com`,
        password: hashedPassword,
        role: UserRole.DESIGNER,
        name: data.name,
        age: data.age,
        isEmailVerified: true,
        designer: {
          create: {
            location: data.location,
            yearsExperience: data.yearsExperience,
            designNiches: data.niches,
            bio: data.bio,
            languages: data.languages,
            profilePhoto: fashionImages.profiles[i % fashionImages.profiles.length],
            contactPhone: data.phone,
            contactEmail: data.email,
          },
        },
      },
      include: { designer: true },
    });
    designers.push(user);
    console.log(`  ✓ Created designer: ${data.name}`);
  }
  console.log(`✅ Created ${designers.length} designers\n`);

  // Create Tailors
  console.log('✂️ Creating tailors...');
  const tailors: any[] = [];
  for (let i = 0; i < tailorData.length; i++) {
    const data = tailorData[i];
    const user = await prisma.user.create({
      data: {
        email: `tailor${i + 1}@neuralthreads.com`,
        password: hashedPassword,
        role: UserRole.TAILOR,
        name: data.name,
        age: data.age,
        isEmailVerified: true,
        tailor: {
          create: {
            location: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            yearsExperience: data.yearsExperience,
            skills: data.skills,
            contactPhone: data.phone,
            contactEmail: data.email,
          },
        },
      },
      include: { tailor: true },
    });
    tailors.push(user);
    console.log(`  ✓ Created tailor: ${data.name}`);
  }
  console.log(`✅ Created ${tailors.length} tailors\n`);

  // Create Portfolio Items
  console.log('🖼️ Creating portfolio items...');
  let portfolioCount = 0;
  const categoryMapping: Record<string, PortfolioCategory> = {
    bridal: PortfolioCategory.BRIDAL,
    casual: PortfolioCategory.CASUAL,
    ethnic: PortfolioCategory.ETHNIC,
    fusion: PortfolioCategory.FUSION,
    contemporary: PortfolioCategory.WESTERN,
  };

  // Portfolio image arrays only (excluding wardrobe object)
  const portfolioImages: Record<string, string[]> = {
    bridal: fashionImages.bridal,
    casual: fashionImages.casual,
    ethnic: fashionImages.ethnic,
    fusion: fashionImages.fusion,
    contemporary: fashionImages.contemporary,
    western: fashionImages.contemporary,
    formal: fashionImages.contemporary,
    sportswear: fashionImages.casual,
  };

  for (const designer of designers) {
    const niches = designer.designer.designNiches;
    const itemsPerDesigner = randomInRange(3, 5);
    
    for (let i = 0; i < itemsPerDesigner; i++) {
      const nicheIndex = i % niches.length;
      const niche = niches[nicheIndex].toLowerCase();
      const descriptions = portfolioDescriptions[niche as keyof typeof portfolioDescriptions] || portfolioDescriptions.casual;
      const images = portfolioImages[niche] || portfolioImages.casual;
      
      const budgetRanges = [
        { min: 5000, max: 15000 },
        { min: 15000, max: 35000 },
        { min: 35000, max: 60000 },
        { min: 60000, max: 100000 },
        { min: 100000, max: 200000 },
      ];
      const budget = getRandomItem(budgetRanges);

      await prisma.portfolioItem.create({
        data: {
          designerId: designer.designer.id,
          imageUrl: images[i % images.length],
          description: descriptions[i % descriptions.length],
          budgetMin: budget.min,
          budgetMax: budget.max,
          category: categoryMapping[niche] || PortfolioCategory.CASUAL,
        },
      });
      portfolioCount++;
    }
  }
  console.log(`✅ Created ${portfolioCount} portfolio items\n`);

  // Create Sample Work
  console.log('🧵 Creating sample work items...');
  let sampleCount = 0;
  for (const tailor of tailors) {
    const itemsPerTailor = randomInRange(2, 4);
    for (let i = 0; i < itemsPerTailor; i++) {
      await prisma.sampleWork.create({
        data: {
          tailorId: tailor.tailor.id,
          imageUrl: fashionImages.alterations[i % fashionImages.alterations.length],
          description: sampleWorkDescriptions[(sampleCount + i) % sampleWorkDescriptions.length],
        },
      });
      sampleCount++;
    }
  }
  console.log(`✅ Created ${sampleCount} sample work items\n`);

  // Create Wardrobe Items
  console.log('👕 Creating wardrobe items...');
  let wardrobeCount = 0;
  for (const customer of customers) {
    const itemsPerCustomer = randomInRange(5, 10);
    const shuffledItems = [...wardrobeItemsData].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(itemsPerCustomer, shuffledItems.length); i++) {
      const item = shuffledItems[i];
      const wardrobeImages: Record<string, string[]> = fashionImages.wardrobe;
      const images = wardrobeImages[item.category] || wardrobeImages.UPPERWEAR;
      
      await prisma.wardrobeItem.create({
        data: {
          customerId: customer.customer.id,
          imageUrl: images[i % images.length],
          category: item.category,
          color: item.color,
        },
      });
      wardrobeCount++;
    }
  }
  console.log(`✅ Created ${wardrobeCount} wardrobe items\n`);

  // Create Chat Conversations
  console.log('💬 Creating chat conversations...');
  let chatCount = 0;
  let messageCount = 0;

  for (let i = 0; i < Math.min(chatMessages.length, customers.length); i++) {
    const customer = customers[i];
    const designer = designers[i % designers.length];
    const messages = chatMessages[i];

    const chat = await prisma.chat.create({
      data: {
        customerId: customer.customer.id,
        designerId: designer.designer.id,
      },
    });
    chatCount++;

    // Create messages with timestamps spread over the past week
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 7);

    for (let j = 0; j < messages.length; j++) {
      const msg = messages[j];
      const messageDate = new Date(baseDate);
      messageDate.setHours(messageDate.getHours() + j * randomInRange(1, 12));

      await prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: msg.isDesigner ? designer.id : customer.id,
          content: msg.content,
          isRead: j < messages.length - 2, // Last 2 messages unread
          createdAt: messageDate,
        },
      });
      messageCount++;
    }
  }
  console.log(`✅ Created ${chatCount} chats with ${messageCount} messages\n`);

  // Create some Alteration Requests
  console.log('📝 Creating alteration requests...');
  const alterationStatuses = [AlterationStatus.PENDING, AlterationStatus.IN_PROGRESS, AlterationStatus.COMPLETED];
  let alterationCount = 0;

  for (let i = 0; i < 5; i++) {
    const customer = customers[i];
    const tailor = tailors[i % tailors.length];
    
    await prisma.alterationRequest.create({
      data: {
        customerId: customer.customer.id,
        tailorId: tailor.tailor.id,
        description: sampleWorkDescriptions[i % sampleWorkDescriptions.length],
        imageUrl: fashionImages.alterations[i % fashionImages.alterations.length],
        status: alterationStatuses[i % alterationStatuses.length],
      },
    });
    alterationCount++;
  }
  console.log(`✅ Created ${alterationCount} alteration requests\n`);

  // Summary
  console.log('═'.repeat(50));
  console.log('🎉 Database seeding completed successfully!\n');
  console.log('Summary:');
  console.log(`  👥 Customers: ${customers.length}`);
  console.log(`  🎨 Designers: ${designers.length}`);
  console.log(`  ✂️ Tailors: ${tailors.length}`);
  console.log(`  🖼️ Portfolio Items: ${portfolioCount}`);
  console.log(`  🧵 Sample Work: ${sampleCount}`);
  console.log(`  👕 Wardrobe Items: ${wardrobeCount}`);
  console.log(`  💬 Chats: ${chatCount}`);
  console.log(`  📨 Messages: ${messageCount}`);
  console.log(`  📝 Alteration Requests: ${alterationCount}`);
  console.log('\n📌 Test Credentials:');
  console.log('   Email: customer1@neuralthreads.com');
  console.log('   Email: designer1@neuralthreads.com');
  console.log('   Email: tailor1@neuralthreads.com');
  console.log('   Password: Password123!');
  console.log('═'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

