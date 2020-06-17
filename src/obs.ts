import OBSWebSocket from 'obs-websocket-js';
import { Scene, Transition, Connection, OBSWebSocketExtended } from './types';

export const obs = new OBSWebSocket() as OBSWebSocketExtended;
// eslint-disable-next-line
(window as any).obs = obs;

export async function connect() {
	try {
		await obs.connect({ address: 'localhost:4444' });
		return true;
	}
	catch(err) {
		obs.emit('error', err);
		return false;
	}
}

export async function getScenes() {
	const {
		'current-scene': currentScene,
		scenes,
		// status
	} = await obs.send('GetSceneList');
	return {
		currentScene,
		scenes: scenes.map(n => ({
			name: n.name,
			type: 'scene'
		}) as Scene)
	};
}

export async function getTransitions() {
	const {
		// 'current-transition': currentTransition,
		transitions,
		// status
	} = await obs.send('GetTransitionList');
	return transitions.map(n => ({
		// The generated TypeScript definitions for obs-websocket-js are
		// currently incorrect. They say the transitions array is made of
		// strings when it is really an array of objects with name properties as
		// strings. This is a compromise just in case it really is a string but
		// I know they aren't. Awaiting obs-websocket-js release
		name: typeof n === 'string' ? n : (n as { name: string }).name,
		type: ''
	}) as Transition);
}

export function setSceneTransitionOverride(connection: Connection, sceneName?: string) {
	const command = 'SetSceneTransitionOverride';
	// eslint-disable-next-line
	return obs.send(command as any, {
		sceneName: sceneName || connection.sceneTo.name,
		transitionName: connection.transition.name,
		transitionDuration: connection.duration
	});
}

connect();

export default {
	connect
};