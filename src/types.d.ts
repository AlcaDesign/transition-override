// import { SceneItem } from "obs-websocket-js";
import OBSWebSocket from 'obs-websocket-js';

type TransitionType = 'obs_stinger_transition' | 'fade_transition' |
	'cut_transition' | 'wipe_transition';

export interface Editor {
	show: boolean;
	isEdit: boolean;
	connection: EditorConnection;
}

export interface CurrentTransition {
	name: string;
	duration: number;
	sceneFrom: string;
	sceneTo: string;
	type: TransitionType;
}

interface OBSWebSocketExtended extends OBSWebSocket {
	_connected: boolean;
}

export interface AppData {
	currentView: 'list' | 'editor' | 'settings';
	editor: Editor;
	currentScene: Scene | null;
	currentTransition: CurrentTransition | null;
	scenes: Scene[];
	transitions: Transition[];
	connections: Connection[];
	obs: OBSWebSocketExtended;
}

export interface Scene {
	name: string;
	type: 'scene' | 'any';
}

export interface Transition {
	name: string;
	type?: 'stinger' | 'cut' | string;
}

export interface Connection {
	title: string;
	sceneFrom: Scene;
	sceneTo: Scene;
	transition: Transition;
	duration: number;
	id: string;
}

type _EditorConnection = Omit<
		Connection,
		'sceneFrom' | 'sceneTo' | 'transition'
	>;

export interface EditorConnection extends _EditorConnection {
	sceneFrom: Scene | null;
	sceneTo: Scene | null;
	transition: Transition | null;
}

export type EditorSubmitResponse = 'ok' | 'duplicate';

export type EditorSubmitRespond = (response: EditorSubmitResponse) => void;

export interface ConnectionListFeatures {
	search: boolean;
	edit: boolean;
	remove: boolean;
	select: boolean;
	sortable: boolean;
	create: boolean;
}

export interface Source {
	alignment: number;
	cx: number;
	cy: number;
	id: number;
	locked: boolean;
	muted: boolean;
	name: string;
	render: boolean;
	source_cx: number;
	source_cy: number;
	type: string;
	volume: number;
	x: number;
	y: number;
}

export interface SceneChangedEventData {
	sceneName: string;
	sources?: Source[];
	// updateType: string;
}

export interface TransitionBeginEventData {
	duration: number;
	fromScene: string;
	name: string;
	toScene: string;
	type: TransitionType;
	updateType: 'TransitionBegin';
}

export interface TransitionEndEventData {
	// Can be -1
	duration: number;
	name: string;
	'to-scene': string;
	type: TransitionType;
	updateType: 'TransitionEnd';
}