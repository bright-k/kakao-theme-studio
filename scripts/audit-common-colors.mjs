import fs from 'node:fs/promises';
import {CATALOG,COMPILER_VERSION} from '../src/catalog.mjs';
import {COMMON_COLORS,COLOR_EXCEPTIONS,auditCommonColors} from '../public/common-colors.js';
const counts=auditCommonColors(CATALOG),report={compilerVersion:COMPILER_VERSION,counts,policies:COMMON_COLORS,unclassified:[]};
await fs.writeFile(new URL('../docs/common-color-coverage.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
const rows=COMMON_COLORS.map(s=>`| ${s.label} | ${[...s.ios,...s.alpha].map(x=>'`'+x+'`').join('<br>')} | ${s.android.map(x=>'`'+x+'`').join('<br>')} | ${s.note||'공통값 적용 후 플랫폼별 재정의 가능'} |`);
const exceptions=Object.entries(COLOR_EXCEPTIONS).flatMap(([platform,items])=>Object.entries(items).map(([id,reason])=>`| ${platform} | \`${id}\` | ${reason} |`));
await fs.writeFile(new URL('../docs/COMMON-COLORS.md',import.meta.url),`# 공통 정책 연결 검토 (${COMPILER_VERSION})

동일 역할의 색상 ${counts.policies}개를 공통 정책으로 관리한다. 공통 자동값은 팔레트의 의미에 따라 양 플랫폼에 같은 색을 매핑하며, 공통 지정값은 commonColors에 보관한다. 기존 팔레트를 화면별 편집 때문에 변경하지 않는다. 플랫폼별 overrides가 가장 우선이고, 예외를 공통값으로 연결할 때만 해당 속성을 해제한다.

명시적인 공통색은 #RRGGBB 불투명 색상이다. 투명도가 있는 자동 목록/입력 메뉴 배경은 공통 기본 투명도(0/.05/.04)를 두 플랫폼에 매핑한다. 자세한 투명도와 Android ARGB는 플랫폼별 재정의를 유지한다. Android가 이름·내용 또는 여러 상태에 하나의 슬롯을 제공하는 경우 공통으로 묶되 iOS만 세분화할 수 있다.

공통 이미지51개와 출력별/플랫폼별/배율별 이미지 예외, 공통 말풍선 본체·캐릭터 및 글자색, 테마 정보·ID·모드는 기존 공통 정책을 유지한다. 9-patch 물리 좌표와 iOS 논리 좌표의 직접 병합은 하지 않으며, 공통 말풍선 기하에서 각 플랫폼 가이드를 생성한다.

## 공통 색상

| 역할 | iOS | Android | 범위·차이 |
|---|---|---|---|
${rows.join('\n')}

## 기존 공통 정책 또는 플랫폼 전용

같은 위치/역할로 볼 수 없는 항목을 이름만 비슷하다는 이유로 합치지 않는다. 아래 예외와 공통 매핑으로 모든 카탈로그 색상·투명도를 전수 분류한다. 새 속성이 누락되면 감사가 실패한다.

| 플랫폼 | 속성 | 분류 근거 |
|---|---|---|
${exceptions.join('\n')}

재현: node scripts/audit-common-colors.mjs. 상세 기계 판독 결과는 common-color-coverage.json이다. 실제 카카오톡 렌더링 검증은 별도다.
`);
console.log(JSON.stringify({policies:counts.policies,ios:counts.ios,android:counts.android,unclassified:[]}));
