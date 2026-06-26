import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import { getEnv } from '@config/env.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'HR Shakya ERP API',
    version: getEnv().APP_VERSION,
    description: 'HR Shakya ERP Platform — REST API documentation',
  },
  servers: [
    {
      url: `http://localhost:${String(getEnv().PORT)}${getEnv().API_PREFIX}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/modules/**/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  const env = getEnv();
  if (!env.SWAGGER_ENABLED) {
    return;
  }

  app.use(env.SWAGGER_PATH, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
