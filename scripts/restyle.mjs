import fs from 'fs';
import path from 'path';

const dir = path.resolve('src/components');
const skip = new Set([
  'Header.tsx',
  'LandingHome.tsx',
  'BrandLogo.tsx',
  'DemoRequestModal.tsx',
  'ScenarioRunner.tsx',
  'GithubTokenModal.tsx',
  'ParticleSwarmCanvas.tsx',
  'AntigravityHero.tsx',
]);

const pairs = [
  ['bg-[#060612]/90', 'bg-[#1A1D22]'],
  ['bg-[#060612]', 'bg-[#1A1D22]'],
  ['bg-[#06060e]/95', 'bg-[#1A1D22]'],
  ['bg-[#06060e]/90', 'bg-[#1A1D22]'],
  ['bg-[#06060e]/80', 'bg-[#1A1D22]'],
  ['bg-[#030712]', 'bg-[#121417]'],
  ['bg-[#020204]/90', 'bg-[#121417]'],
  ['bg-[#020204]/80', 'bg-[#121417]'],
  ['bg-[#080810]', 'bg-[#121417]'],
  ['bg-[#010309]', 'bg-[#121417]'],
  ['bg-[#05050a]/80', 'bg-[#121417]'],
  ['border-cyan-500/80', 'border-[#C1352C]'],
  ['border-cyan-500/60', 'border-[#C1352C]/50'],
  ['border-cyan-500/50', 'border-[#C1352C]/40'],
  ['border-cyan-500/40', 'border-[#2C3139]'],
  ['border-cyan-500/30', 'border-[#2C3139]'],
  ['border-cyan-500/20', 'border-[#2C3139]'],
  ['text-cyan-400', 'text-[#C1352C]'],
  ['text-cyan-300', 'text-zinc-200'],
  ['text-cyan-200', 'text-zinc-100'],
  ['bg-cyan-500/20', 'bg-[#C1352C]/10'],
  ['bg-cyan-500/10', 'bg-[#C1352C]/10'],
  ['bg-cyan-950/80', 'bg-[#C1352C]/10'],
  ['bg-cyan-950/60', 'bg-[#C1352C]/10'],
  ['bg-cyan-950', 'bg-[#C1352C]/10'],
  ['from-cyan-400 via-indigo-500 to-purple-600', 'from-zinc-700 to-zinc-900'],
  ['from-cyan-500 to-blue-600', 'from-[#C1352C] to-[#A82D26]'],
  ['from-cyan-400 to-blue-500', 'from-[#C1352C] to-[#A82D26]'],
  ['hover:from-cyan-400 hover:to-blue-500', 'hover:from-[#A82D26] hover:to-[#8F261F]'],
  ['text-blue-950', 'text-zinc-900'],
  ['text-blue-900', 'text-zinc-800'],
  ['text-blue-700', 'text-zinc-600'],
  ['bg-blue-950', 'bg-zinc-900'],
  ['bg-blue-900', 'bg-zinc-800'],
  ['hover:bg-blue-950', 'hover:bg-zinc-900'],
  ['hover:bg-blue-900', 'hover:bg-zinc-800'],
  ['border-blue-900', 'border-zinc-800'],
  ['border-blue-300', 'border-[#E6E8EC]'],
  ['border-blue-200', 'border-[#E6E8EC]'],
  ['bg-blue-100', 'bg-zinc-100'],
  ['bg-blue-50', 'bg-zinc-50'],
  ['hover:border-cyan-400', 'hover:border-[#C1352C]/50'],
  ['hover:border-blue-900', 'hover:border-zinc-400'],
  ['rounded-xl', 'rounded-2xl'],
  ['rounded-lg', 'rounded-xl'],
  ['Text2Business', 'NeuroBiz'],
  ['TEXT2BUSINESS', 'NEUROBIZ'],
];

const glow = /shadow-\[[^\]]+\]/g;

for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.tsx') || skip.has(name)) continue;
  const file = path.join(dir, name);
  let s = fs.readFileSync(file, 'utf8');
  for (const [a, b] of pairs) s = s.split(a).join(b);
  s = s.replace(glow, '');
  s = s.replace(/ {2,}/g, (m) => m); // keep
  fs.writeFileSync(file, s);
  console.log('updated', name);
}
