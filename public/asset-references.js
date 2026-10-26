import {platformBubbleAssets} from './bubble-model.js';
// Settings references include inactive modes and fallback sources, not just visible pixels.
export const assetReferences=p=>[...new Set([...Object.values(p.assets??{}),...Object.values(p.resourceOverrides??{}),...platformBubbleAssets(p).map(a=>a.ref)])];
