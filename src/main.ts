import { existsSync, mkdirSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './prisma/prisma-client-exception.filter';

async function bootstrap() {
  if (existsSync('.env')) loadEnvFile();

  // Garantizar que el directorio de imágenes existe al arrancar
  mkdirSync(join(process.cwd(), 'uploads', 'productos'), { recursive: true });

  const app = await NestFactory.create(AppModule);
  const httpAdapterHost = app.get(HttpAdapterHost);

  app.enableShutdownHooks();
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapterHost));

  //await app.listen(Number(process.env.PORT ?? 3007));
  await app.listen(process.env.PORT || 3007, '0.0.0.0');
  console.log(`MS Inventario corriendo en puerto ${process.env.PORT ?? 3007}`);
}
void bootstrap();
