import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: { getAllAndOverride: jest.fn() } },
      ],
    }).compile();
    guard = modules.get<RolesGuard>(RolesGuard);
  });
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
