export enum FetchStatus {
	Idle = 'idle',
	Loading = 'loading',
	Success = 'success',
	Error = 'error',
}

export const defaultAlias = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	alternateName: '',
	logo: '',
	image: '',
	homeLocation: {
		'@type': 'Place',
		name: '',
	},
	description: '',
	url: '',
	paymail: '',
	bitcoinAddress: '',
};
