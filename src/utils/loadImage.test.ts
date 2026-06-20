import { describe, it, expect } from 'vitest';
import { loadImage, loadImages } from './loadImage';

describe('loadImage', () => {
  it('returns a Promise', () => {
    const result = loadImage('test.png');
    expect(result).toBeInstanceOf(Promise);
  });

  it('loadImages with empty record resolves immediately', async () => {
    const result = await loadImages({});
    expect(result).toEqual({});
  });
});
