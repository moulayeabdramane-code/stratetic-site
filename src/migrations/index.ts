import * as migration_20261016_100600_initial from './20261016_100600_initial';

export const migrations = [
  {
    up: migration_20261016_100600_initial.up,
    down: migration_20261016_100600_initial.down,
    name: '20261016_100600_initial'
  },
];
