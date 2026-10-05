import { expect, test } from 'bun:test';
import { checkSong } from '@voxelparty/sdk/core';
import { MUSIC } from './sounds';

// Every track loops over its own length: one that isn't a whole number of bars drifts off the beat.
test('the theme loops cleanly', () => {
  expect(checkSong(MUSIC)).toEqual([]);
});
