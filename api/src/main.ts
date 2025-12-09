import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'], // dashboard + widget
    // or origin: true in dev to reflect request origin dynamically
  });

  await app.listen(3000);
}
bootstrap();