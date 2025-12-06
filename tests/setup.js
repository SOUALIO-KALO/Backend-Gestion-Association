// backend/tests/setup.js

// Configuration globale pour les tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-minimum-32-characters-long";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4"; // Moins de rounds pour les tests

// Désactiver les logs pendant les tests
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();

// Timeout global
jest.setTimeout(10000);
