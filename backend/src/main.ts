import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for production domain
  app.enableCors({
    origin: ['http://optik.codenusa.id', 'https://optik.codenusa.id', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // NOTE: Global prefix removed - controllers already use 'api/' prefix
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Optik88 API')
    .setDescription('Optik88 POS & Inventory Management System API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`NestJS server is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
