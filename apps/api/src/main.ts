import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { createOpenApiDocument } from './openapi/openapi';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

type LogLevel = 'log' | 'debug' | 'warn' | 'error' | 'verbose';

const LOG_LEVELS: Record<string, LogLevel[]> = {
  debug: ['log', 'debug', 'warn', 'error', 'verbose'],
  warn: ['warn', 'error'],
  error: ['error'],
};

async function bootstrap() {
  const logLevel = process.env.LOG_LEVEL || 'debug';
  const logLevels = LOG_LEVELS[logLevel] || LOG_LEVELS.debug;

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const document = createOpenApiDocument(app);
  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
    jsonDocumentUrl: 'openapi.json',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
void bootstrap();
