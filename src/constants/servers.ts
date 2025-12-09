/**
 * Server definitions for BitChat Nitro
 *
 * - isNative: true means this is the native BitChat interface (not loaded in iframe)
 * - isNative: false means this server will be loaded in an iframe
 */

export interface ServerDefinition {
	_id: string;
	name: string;
	description: string;
	icon: string;
	paymail?: string;
	isNative: boolean;
	url?: string; // URL to load in iframe (only for non-native servers)
}

export const SERVERS: ServerDefinition[] = [
	{
		_id: 'bitchat',
		name: 'BitChat',
		description: 'The main BitChat server',
		icon: '/images/blockpost-logo.svg',
		paymail: 'bitchat@bitchatnitro.com',
		isNative: true, // This is the native interface, not an iframe
	},
	// Future servers can be added here with isNative: false
	// Example:
	// {
	//   _id: 'other-server',
	//   name: 'Other Server',
	//   description: 'Another server',
	//   icon: '/images/other-server.svg',
	//   isNative: false,
	//   url: 'https://other-server.com',
	// },
];

export const getBitchatServer = (): ServerDefinition => {
	const server = SERVERS.find((s) => s._id === 'bitchat');
	if (!server) {
		throw new Error('BitChat server not found in server definitions');
	}
	return server;
};

export const getServerById = (id: string): ServerDefinition | undefined => {
	return SERVERS.find((s) => s._id === id);
};
