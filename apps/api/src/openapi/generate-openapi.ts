import { NestFactory } from '@nestjs/core';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppModule } from '../app.module';
import { createOpenApiDocument } from './openapi';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  const document = createOpenApiDocument(app);

  const outDir = resolve(process.cwd(), 'openapi');
  await mkdir(outDir, { recursive: true });
  await writeFile(
    resolve(outDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
    'utf-8',
  );

  await app.close();
}

generate().catch((err) => {
  process.stderr.write(String(err));
  process.exitCode = 1;
});
