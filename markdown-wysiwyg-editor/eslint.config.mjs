import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			'@stylistic/semi': 'warn',
			'curly': 'warn',
			'eqeqeq': 'warn',
			'no-throw-literal': 'warn'
		}
	}
);
