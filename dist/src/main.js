"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    console.log('SME Backend is running, and here is the ENV variables: ', process.env);
    const corsOriginEnv = process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';
    const corsOrigins = corsOriginEnv
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    app.enableCors({
        origin: corsOrigins.length > 0 ? corsOrigins : undefined,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map