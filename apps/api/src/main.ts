import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const isProd = config.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());

  // Behind nginx, so trust the proxy for correct client IPs in rate limiting.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGIN', 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('RentWise API')
      .setDescription('Auth and saved rent-affordability scenarios')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 4000);
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://localhost:${port}/api`);
  if (!isProd) logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
