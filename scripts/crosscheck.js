// 두 만세력 라이브러리가 같은 사주를 내는지 무작위 생년월일로 대량 비교한다.
// 실행: npm run crosscheck
import { computeSaju } from '../lib/saju.js';

const SAMPLES = 5000;
let seed = 20261030;
const rand = (n) => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed % n;
};

let mismatched = 0;
const examples = [];
for (let i = 0; i < SAMPLES; i += 1) {
  const year = 1990 + rand(17);
  const month = 1 + rand(12);
  const day = 1 + rand(new Date(year, month, 0).getDate());
  const hour = rand(24);
  const minute = rand(60);
  const r = computeSaju({ year, month, day, hour, minute });
  if (!r.crossCheck.ok) {
    mismatched += 1;
    if (examples.length < 10) {
      examples.push({ input: `${year}-${month}-${day} ${hour}:${minute}`, mismatches: r.crossCheck.mismatches });
    }
  }
}

console.log(`표본 ${SAMPLES}건 중 일치 ${SAMPLES - mismatched}건, 불일치 ${mismatched}건`);
console.log(`일치율 ${(((SAMPLES - mismatched) / SAMPLES) * 100).toFixed(2)}%`);
if (examples.length) console.table(examples);
