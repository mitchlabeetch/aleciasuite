// services/cms/config/plugins.ts
// Strapi CE — Minio S3 upload provider configuration

export default ({ env }: { env: (key: string, fallback?: any) => any }) => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env("MINIO_ACCESS_KEY"),
            secretAccessKey: env("MINIO_SECRET_KEY"),
          },
          region: "us-east-1",
          endpoint: env("MINIO_ENDPOINT", "https://s3.alecia.fr"),
          forcePathStyle: true,
          params: {
            Bucket: env("MINIO_BUCKET", "alecia-media"),
          },
        },
      },
    },
  },
});
