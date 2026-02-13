// services/cms/config/database.ts
// Strapi CE — PostgreSQL connection with alecia_cms schema

export default ({ env }: { env: (key: string, fallback?: any) => any }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("DATABASE_HOST", "alecia-postgres"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME", "alecia"),
      user: env("DATABASE_USERNAME", "alecia"),
      password: env("DATABASE_PASSWORD"),
      schema: env("DATABASE_SCHEMA", "alecia_cms"),
      ssl: env.bool("DATABASE_SSL", false),
    },
  },
});
