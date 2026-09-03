// Provide a valid-enough env for unit tests that touch env validation.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/al_rehla_test';
process.env.APP_URL = 'http://localhost:3000';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
