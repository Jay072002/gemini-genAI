exports.up = async function (knex) {
  // Enable required extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Ensure the embeddings table exists
  const embeddingsTableExists = await knex.schema.hasTable('embeddings');
  if (!embeddingsTableExists) {
      await knex.schema.createTable('embeddings', (table) => {
          table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
          // Change from uuid to integer to match the users table id
          table.integer('user_id').notNullable();
          table.string('name');
          table.text('bio');
          table.jsonb('categories');
          table.jsonb('tags');
          table.specificType('vector', 'vector(768)').notNullable();
          table.timestamps(true, true);
      });

      // Create index for vector similarity search
      await knex.raw(
          'CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100)'
      );

      // Add the foreign key constraint using a raw query
      await knex.raw(
          'ALTER TABLE embeddings ADD CONSTRAINT embeddings_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
      );
  } else {
      console.log("Table 'embeddings' already exists, skipping creation.");
  }
};

exports.down = async function (knex) {
  // Drop the embeddings table if it exists
  const embeddingsTableExists = await knex.schema.hasTable('embeddings');
  if (embeddingsTableExists) {
      await knex.schema.dropTableIfExists('embeddings');
  }
};
