describe('config/database', () => {
  function loadDatabaseConfig() {
    jest.resetModules();

    const prismaClient = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
    const PrismaClient = jest.fn(() => prismaClient);

    jest.doMock('@prisma/client', () => ({
      PrismaClient,
    }));

    return {
      databaseConfig: require('../../../src/config/database'),
      PrismaClient,
      prismaClient,
    };
  }

  test('creates a shared Prisma client instance', () => {
    const { databaseConfig, PrismaClient, prismaClient } = loadDatabaseConfig();

    expect(databaseConfig).toBeTruthy();
    expect(PrismaClient).toHaveBeenCalled();
    expect(databaseConfig).toBe(prismaClient);
  });
});
