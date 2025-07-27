import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CONNECTION } from './types';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const redisHost =
          configService.get<string>('REDIS_HOST') || 'localhost';
        const redisPort = configService.get<string>('REDIS_PORT') || 6379;
        const redisPassword =
          configService.get<string>('REDIS_PASSWORD')?.trim() || undefined;

        const redisInstance = new Redis({
          connectTimeout:
            configService.get<number>('REDIS_CONNECT_TIMEOUT') || 5000,
          host: redisHost,
          port: +redisPort,
          password: redisPassword,
        });

        redisInstance.on('connect', () => {
          console.log('✅ Connected to Redis');
        });

        redisInstance.on('error', (err) => {
          console.error('❌ Redis error:', err);
        });
        return redisInstance;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CONNECTION],
})
export class RedisModule {}
