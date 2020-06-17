// import crypto from 'crypto';

import { Editor, EditorConnection } from './types';

export function generateDefaultConnection() {
	const connection: EditorConnection = {
		title: 'Untitled Connection',
		sceneFrom: null,
		sceneTo: null,
		transition: null,
		duration: 300,
		id: ''
	};
	return connection;
}

export function generateEditorDefaults() {
	const editor: Editor = {
		show: false,
		isEdit: false,
		connection: generateDefaultConnection()
	};
	return editor;
}

// export function sha1(value: crypto.BinaryLike) {
// 	const hash = crypto.createHash('sha1');
// 	return hash.update(value).digest('hex');
// }

export function generateConnectionID() {
	return Math.random().toString(16).slice(-8);
	// const joined = [ c.sceneFrom, c.transition, c.sceneTo ]
	// 	.map(n => encodeURIComponent(JSON.stringify(n))).join('+');
	// return sha1(joined);
}