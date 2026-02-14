// services/cms/config/plugins.js
// Strapi CE — Minio S3 upload provider configuration

module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env("AWS_ACCESS_KEY_ID"),
            secretAccessKey: env("AWS_ACCESS_SECRET"),
          },
          region: "us-east-1",
          endpoint: env("AWS_ENDPOINT", "http://alecia-minio:9000"),
          forcePathStyle: true,
          params: {
            Bucket: env("AWS_BUCKET", "strapi-uploads"),
          },
        },
      },
    },
  },
});
