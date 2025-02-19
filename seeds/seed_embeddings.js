const { GoogleGenerativeAI } = require("@google/generative-ai");
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Define categories and their associated data
const categoryTemplates = {
  Technology: {
    namePrefix: ['Complete', 'Advanced', 'Professional', 'Beginner-Friendly', 'Comprehensive'],
    subjects: ['Python', 'JavaScript', 'React', 'Data Science', 'Machine Learning', 'Web Development', 'Cloud Computing', 'DevOps', 'Cybersecurity', 'Mobile App Development'],
    tags: ['programming', 'coding', 'tech', 'software', 'development', 'engineering', 'computer science']
  },
  Business: {
    namePrefix: ['Strategic', 'Professional', 'Expert', 'Essential', 'Practical'],
    subjects: ['Digital Marketing', 'Project Management', 'Leadership', 'Entrepreneurship', 'Business Analytics', 'Financial Planning', 'Sales Mastery', 'Start-up Management'],
    tags: ['business', 'management', 'leadership', 'marketing', 'entrepreneurship', 'finance']
  },
  Health: {
    namePrefix: ['Complete', 'Holistic', 'Professional', 'Personalized', 'Advanced'],
    subjects: ['Yoga', 'Nutrition', 'Mental Wellness', 'Fitness Training', 'Meditation', 'Weight Management', 'Personal Training'],
    tags: ['health', 'wellness', 'fitness', 'mindfulness', 'nutrition', 'lifestyle']
  },
  Creative: {
    namePrefix: ['Professional', 'Creative', 'Artistic', 'Complete', 'Practical'],
    subjects: ['Digital Art', 'Photography', 'Graphic Design', 'Video Editing', 'Music Production', 'Creative Writing', 'Animation'],
    tags: ['art', 'design', 'creativity', 'digital', 'media', 'visual']
  },
  Culinary: {
    namePrefix: ['Gourmet', 'Professional', 'Essential', 'Advanced', 'Master'],
    subjects: ['Cooking', 'Baking', 'Wine Tasting', 'Food Photography', 'Restaurant Management', 'Pastry Arts'],
    tags: ['cooking', 'food', 'culinary', 'kitchen', 'gastronomy', 'recipes']
  }
};

function generateEntry(userId) {
  // Randomly select a category
  const categories = Object.keys(categoryTemplates);
  const mainCategory = faker.helpers.arrayElement(categories);
  const template = categoryTemplates[mainCategory];
  
  // Generate course name
  const prefix = faker.helpers.arrayElement(template.namePrefix);
  const subject = faker.helpers.arrayElement(template.subjects);
  const name = `${prefix} ${subject} ${faker.helpers.arrayElement(['Course', 'Masterclass', 'Workshop', 'Program', 'Training'])}`;
  
  // Generate bio
  const bio = `${faker.lorem.paragraph(2)} This ${subject.toLowerCase()} course is designed to ${faker.helpers.arrayElement([
    'help you master essential skills',
    'provide practical industry knowledge',
    'transform your understanding',
    'advance your career',
    'build your expertise'
  ])}.`;
  
  // Generate categories (main category + possible related ones)
  const entryCategories = [mainCategory];
  if (faker.number.int(100) > 70) { // 30% chance to add a second category
    const secondCategory = faker.helpers.arrayElement(categories.filter(c => c !== mainCategory));
    entryCategories.push(secondCategory);
  }
  
  // Generate tags
  const baseTags = template.tags;
  const specificTags = [
    subject.toLowerCase().replace(' ', '-'),
    faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    faker.helpers.arrayElement(['online', 'self-paced', 'certified', 'professional'])
  ];
  const tags = [...new Set([...specificTags, ...faker.helpers.arrayElements(baseTags, 3)])];

  return {
    userId,
    name,
    bio,
    categories: entryCategories,
    tags
  };
}

exports.seed = async function(knex) {
  try {
    // Clear existing entries
    await knex('embeddings').del();
    
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const totalEntries = 300;
    const batchSize = 50; // Process in batches to avoid overwhelming the API

    for (let i = 0; i < totalEntries; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, totalEntries - i) }, (_, index) => 
        generateEntry(i + index + 1)
      );

      for (const data of batch) {
        // Create structured text for embedding

        const structuredText = `
          Name: ${data.name} [HIGH PRIORITY]
          Bio: ${data.bio}
          Categories: ${data.categories.join(", ")}
          Tags: ${data.tags.join(", ")}
        `;

        // Generate embedding
        const result = await model.embedContent(structuredText);
        const embedding = result.embedding.values;

        await knex('embeddings').insert({
          user_id: data.userId,
          name: data.name,
          bio: data.bio,
          categories: JSON.stringify(data.categories),
          tags: JSON.stringify(data.tags),
          vector: JSON.stringify(embedding),
          created_at: new Date(),
          updated_at: new Date()
        });
        
        console.log(`Inserted ${i + batch.indexOf(data) + 1}/${totalEntries}: ${data.name}`);
      }
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding data:", error.message);
    throw error;
  }
};
