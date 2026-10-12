import { expect, test } from 'bun:test';
import { checkSong } from '@voxelparty/sdk/core';
import { MUSIC, MUSIC_BEATS, RADIO, RADIO_BEATS } from './sounds';

// Every track loops over its own length: one that isn't a whole number of bars drifts off the beat.
test('the waltz loops cleanly', () => {
  expect(checkSong(MUSIC, MUSIC_BEATS)).toEqual([]);
});

// The radio's dance band keeps the same discipline: two beats a bar, every line a whole number of bars.
test('the radio loops cleanly', () => {
  expect(checkSong(RADIO, RADIO_BEATS)).toEqual([]);
});
