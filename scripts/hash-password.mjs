/**
 * 교사 관리자 비밀번호의 bcrypt 해시를 생성합니다.
 * 사용법: node scripts/hash-password.mjs "원하는비밀번호"
 * 출력된 값을 .env.local 의 TEACHER_PASSWORD_HASH 에 넣으세요.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('사용법: node scripts/hash-password.mjs "원하는비밀번호"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log(`TEACHER_PASSWORD_HASH=${hash}`);
