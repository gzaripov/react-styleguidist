/* eslint-disable @typescript-eslint/no-var-requires */
import { Configuration } from 'webpack';
import last from 'lodash/last';
import styleguidist from '../index.esm';

jest.mock('../build');
jest.mock('../server');

const getDefaultWebpackConfig = async (): Promise<any> =>
	(await styleguidist()).makeWebpackConfig();

const cwd = process.cwd();
afterEach(() => {
	process.chdir(cwd);
});

it('should return API methods', async () => {
	const api = await styleguidist(require('../../../test/data/styleguide.config.js'));
	expect(api).toBeTruthy();
	expect(typeof api.build).toBe('function');
	expect(typeof api.server).toBe('function');
	expect(typeof api.makeWebpackConfig).toBe('function');
});

describe('makeWebpackConfig', () => {
	it('should return development Webpack config', async () => {
		const api = await styleguidist();
		const result = api.makeWebpackConfig('development');
		expect(result).toBeTruthy();
		expect(result.output && result.output.filename).toBe('build/[name].bundle.js');
		expect(result.output && result.output.chunkFilename).toBe('build/[name].js');
	});

	it('should return production Webpack config', async () => {
		const api = await styleguidist();
		const result = api.makeWebpackConfig('production');
		expect(result).toBeTruthy();
		expect(result.output && result.output.filename).toBe('build/bundle.[chunkhash:8].js');
		expect(result.output && result.output.chunkFilename).toBe('build/[name].[chunkhash:8].js');
	});

	it('should merge webpackConfig config option', async () => {
		const defaultWebpackConfig = await getDefaultWebpackConfig();
		const api = await styleguidist({
			webpackConfig: {
				resolve: {
					extensions: ['.scss'],
				},
			},
		});
		const result = api.makeWebpackConfig() as any;

		expect(result).toBeTruthy();
		expect(result.resolve.extensions.length).toEqual(
			defaultWebpackConfig.resolve.extensions.length + 1
		);
		expect(last(result.resolve.extensions)).toEqual('.scss');
	});

	it('should merge webpackConfig but ignore output section', async () => {
		const defaultWebpackConfig = await getDefaultWebpackConfig();
		const api = await styleguidist({
			webpackConfig: {
				resolve: {
					extensions: ['.scss'],
				},
				output: {
					filename: 'broken.js',
				},
			},
		});
		const result = api.makeWebpackConfig();

		expect(result.output && result.output.filename).toEqual(
			defaultWebpackConfig.output && defaultWebpackConfig.output.filename
		);
	});

	it('should merge webpackConfig config option as a function', async () => {
		const api = await styleguidist({
			webpackConfig: (env: string) => ({
				_env: env,
			}),
		});
		const result = api.makeWebpackConfig() as any;

		expect(result).toBeTruthy();
		expect(result._env).toEqual('production');
	});

	it('should apply updateWebpackConfig config option', async () => {
		const defaultWebpackConfig = await getDefaultWebpackConfig();
		const api = await styleguidist({
			dangerouslyUpdateWebpackConfig: (webpackConfig: Configuration, env: string) => {
				if (webpackConfig.resolve && webpackConfig.resolve.extensions) {
					webpackConfig.resolve.extensions.push(env);
				}
				return webpackConfig;
			},
		});
		const result = api.makeWebpackConfig() as any;

		expect(result).toBeTruthy();
		expect(result.resolve.extensions.length).toEqual(
			defaultWebpackConfig.resolve.extensions.length + 1
		);
		expect(last(result.resolve.extensions)).toEqual('production');
	});

	it('should merge Create React App Webpack config', async () => {
		process.chdir('test/apps/basic');
		const api = await styleguidist();
		const result = api.makeWebpackConfig();

		expect(result).toBeTruthy();
		expect(result.module).toBeTruthy();
	});

	it('should add webpack entry for each require config option item', async () => {
		const modules = ['babel-polyfill', 'path/to/styles.css'];
		const api = await styleguidist({
			require: modules,
		});
		const result = api.makeWebpackConfig();

		expect(result.entry).toEqual(expect.arrayContaining(modules));
	});

	it('should add webpack alias for each styleguideComponents config option item', async () => {
		const api = await styleguidist({
			styleguideComponents: {
				Wrapper: 'styleguide/components/Wrapper',
				StyleGuideRenderer: 'styleguide/components/StyleGuide',
			},
		});
		const result = api.makeWebpackConfig() as any;

		expect(result.resolve.alias).toMatchObject({
			'rsg-components/Wrapper': 'styleguide/components/Wrapper',
			'rsg-components/StyleGuide/StyleGuideRenderer': 'styleguide/components/StyleGuide',
		});
	});
});

describe('build', () => {
	it('should pass style guide config and stats to callback', async () => {
		const config = {
			components: '*.js',
		};
		const callback = jest.fn();
		const api = await styleguidist(config);
		api.build(callback);

		expect(callback).toBeCalled();
		expect(callback.mock.calls[0][1].components).toBe(config.components);
		expect(callback.mock.calls[0][2]).toEqual({ stats: true });
	});
});

describe('server', () => {
	it('should pass style guide config to callback', async () => {
		const config = {
			components: '*.js',
		};
		const callback = jest.fn();
		const api = await styleguidist(config);
		api.server(callback);

		expect(callback).toBeCalled();
		expect(callback.mock.calls[0][1].components).toBe(config.components);
	});
});
