# bun-mongo-api - Bun API 
Using bun serve(), an API that interacts with mongoDb, quicketAPI and openAI.
To create, fetch and enrich event data.

## Testing with Docker
This project is set up to be run with containers on a VPS
via a main parent docker [repo](https://github.com/imprisonedmind/giggity-docker).
```bash
docker build -t bun-api .
docker run -p 8080:8080 bun-api
```


## Testing Normally
If you wish to just run the front-end, run it normally with bun.
```bash
bun i 
bun run dev
```