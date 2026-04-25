import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const OPENAPI_TITLE = 'Ticket System API';
export const OPENAPI_VERSION = '1.0.0';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle(OPENAPI_TITLE)
    .setVersion(OPENAPI_VERSION)
    .build();

  return SwaggerModule.createDocument(app, config);
}
