FROM deepset/haystack:cpu-2.6.1

WORKDIR /app

COPY pipelines.yml .

ENV DATABASE_URL=""
ENV OPENAI_API_KEY=""

EXPOSE 8000

CMD ["haystack", "pipeline", "run", "--pipeline-config", "pipelines.yml"]
