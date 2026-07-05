import { existsSync, mkdirSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // 👈 1. ¡IMPORTANTE IMPORTAR ESTO!
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

  // 👈 2. CREAR LA CONFIGURACIÓN BASE QUE LE FALTABA A TU ARCHIVO:
  const config = new DocumentBuilder()
    .setTitle('CliniCore - MS Inventario y Stock')
    .setDescription('Endpoints exclusivos del módulo de Inventario, Categorías y Stock')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 🎯 Exponer la documentación y el JSON crudo
  SwaggerModule.setup('api/v1/productos/docs', app, document, {
    swaggerOptions: {
      jsonEditor: true, 
    }
  });

  await app.listen(process.env.PORT || 3007, '0.0.0.0');
  console.log(`MS Inventario corriendo en puerto ${process.env.PORT ?? 3007}`);
}
void bootstrap();