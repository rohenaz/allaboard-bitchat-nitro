import 'twin.macro';
import type { css as cssImport } from '@emotion/react';
import type { CSSInterpolation } from '@emotion/serialize';
import type styledImport from '@emotion/styled';

declare module 'twin.macro' {
	const styled: typeof styledImport;
	const css: typeof cssImport;
}

declare module 'react' {
	interface DOMAttributes<T> {
		tw?: string;
		css?: CSSInterpolation;
	}
}
