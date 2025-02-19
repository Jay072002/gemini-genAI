const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const express = require('express')
const { Client } = require("pg");
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken");
const Fuse = require('fuse.js');
const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');

dotenv.config();

const apiKey = process.env.API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
app.use(express.json());

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader;

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
}

// User login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await client.query("SELECT * FROM users WHERE username = $1", [
        username,
    ]);

    if (user.rows.length === 0)
        return res.status(400).json({ error: "User not found" });

    // Add proper password validation using bcrypt
    const validPassword = true
    // const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword)
        return res.status(400).json({ error: "Invalid password" });

    const accessToken = jwt.sign(
        { userId: user.rows[0].id },  // Using id instead of user_id
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "12h" }
    );
    res.json({ accessToken });
});

// Fetch creator metadata
async function getCreatorMetadata() {
    const result = await client.query(`
        SELECT u.id, u.name, u.bio, c.title as channel_title, cc.category_name
        FROM users u
        JOIN channel_members cm ON u.id = cm.member_id
        JOIN channel c ON cm.channel_id = c.id
        JOIN channel_category cc ON c.category_id = cc.id
    `);

    return result.rows.map(row => ({
        id: row.id,
        text: `${row.name} ${row.bio} ${row.channel_title} ${row.category_name}`
    }));
}

// Generate and store creator embeddings
async function generateAndStoreCreatorEmbeddings() {
    const creators = await getCreatorMetadata();
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    for (const creator of creators) {
        const result = await model.embedContent(creator.text);
        const embedding = result.embedding.values;

        await client.query(
            "INSERT INTO creator_embeddings (creator_id, embedding) VALUES ($1, $2) ON CONFLICT (creator_id) DO UPDATE SET embedding = $2",
            [creator.id, JSON.stringify(embedding)]
        );
    }
    console.log("Embeddings created and stored!");
}

app.post("/embed", authenticateToken, async (req, res) => {
    try {
        const { name, bio, categories, tags } = req.body;
        const userId = req.user.userId;  // This comes from JWT payload

        const structuredText = `
        Name: ${name} [HIGH PRIORITY]
        Bio: ${bio} 
        Categories: ${categories.join(", ")}
        Tags: ${tags.join(", ")}
        `;

        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(structuredText);
        const embedding = result.embedding;

        await client.query(
            "INSERT INTO embeddings (user_id, name, bio, categories, tags, vector) VALUES ($1, $2, $3, $4, $5, $6)",
            [userId, name, bio, JSON.stringify(categories), JSON.stringify(tags), embedding]
        );

        res.json({ success: true, userId, name });
    } catch (error) {
        console.error('Error in /embed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Recommend creators based on fan search
app.post("/recommend", authenticateToken, async (req, res) => {
    try {
      const { text } = req.body;
  
      // Define the options for Fuse.js
      const options = {
        includeScore: true,
        keys: ['name', 'bio', 'categories', 'tags']
      };
  
      // Initialize Fuse.js with your data
      const fuse = new Fuse(yourDataArray, options);
  
      // Perform the fuzzy search
      const results = fuse.search(text);
  
      // Process the results
      const recommendations = results.map(result => ({
        name: result.item.name,
        bio: result.item.bio,
        categories: result.item.categories,
        tags: result.item.tags,
        similarity: 1 - result.score // Convert score to similarity
      }));
  
      // Optionally, filter out low-similarity recommendations
      const filteredRecommendations = recommendations.filter(r => r.similarity > 0.6);
  
      res.json(filteredRecommendations);
    } catch (error) {
      console.error("Error in /recommend:", error);
      res.status(500).json({ error: error.message });
    }
  });

// Cosine Similarity function for custom matching
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Initialize DB connection
const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

client.connect().then(() => {
    console.log('Database connected');
}).catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
});

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
