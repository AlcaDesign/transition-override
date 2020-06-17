<template lang="pug">
	#app
		.header
			| #[.header-title {{ headerTitle }}] #[.header-detail {{ headerDetail }}]
			.button.icon.checkbox(
				v-show="currentView !== 'editor'"
				:checked="currentView === 'settings'"
				@click="currentView = currentView === 'list' ? 'settings' : 'list'"
			)
				.icon.settings
			.obs-connection.tipped(:class="{ connected: obs._connected }")
				tipped.left {{ connectionStatus }}
		ConnectionList(
			v-show="currentView === 'list'"
			:connections="connections"
			:currentScene="currentScene"
			@openEditor="openEditor"
		)
		ConnectionEditor(
			v-show="currentView === 'editor'"
			:editor="editor"
			:scenes="scenes"
			:transitions="transitions"
			:connections="connections"
			@submit="editorSubmit"
			@cancel="editorCancel"
			@removed="editorRemoved"
		)
		Settings(
			v-show="currentView === 'settings'"
			:settings="{ connections }"
		)
		//- pre {{ editor }}
		//- .button
		//- 	tipped Wow
		//- 	| Hello World
	</div>
</template>

<script lang="ts">
import OBSWebSocket from 'obs-websocket-js';
import {
	AppData, Connection, EditorConnection, Scene, SceneChangedEventData,
	TransitionBeginEventData, TransitionEndEventData, EditorSubmitRespond
} from './types';
import { generateEditorDefaults, generateConnectionID } from './utils';
import store from './storage';

import Vue from 'vue';

import ConnectionList from './components/ConnectionList.vue';
import ConnectionEditor from './components/ConnectionEditor.vue';
import Settings from './components/Settings.vue';
import Tipped from './components/sub/Tipped.vue';

import OBS, {
	obs, getScenes, getTransitions, setSceneTransitionOverride
} from './obs';

export default Vue.extend({
	components: {
		ConnectionList,
		ConnectionEditor,
		Settings,
		Tipped
	},
	async created() {
		// const _conns = this.$storage.remember('connections', async () => {
		// 	const connections: Connection[] = [];
		// 	return connections;
		// });
		// const connections = await (_conns as unknown as Promise<Connection[]>);
		// if(Array.isArray(connections)) {
		// 	this.connections = connections;
		// }
		const connections = store.remember('connections', []);
		this.connections = connections;
		this.$watch('connections', (/* newValue, oldValue */) => {
			store.set('connections', this.connections);
		}, { deep: true });
	},
	destroyed() {
		obs.removeAllListeners();
	},
	async mounted() {
		console.log('Mounted');
		obs.removeAllListeners();
		// obs.on('ConnectionOpened', () => console.log('Open'));
		obs.on('ConnectionClosed', () => {
			console.log('Close');
			this.currentScene = null;
			OBS.connect();
		});
		// obs.on('AuthenticationSuccess', () => console.log('Authed'));
		// obs.on('AuthenticationFailure', () => console.log('Auth failed'));
		obs.on('error' as Parameters<OBSWebSocket['on']>[0], console.error);
		obs.on('SwitchScenes', data => {
			this.sceneChanged(data as unknown as SceneChangedEventData);
		});
		// eslint-disable-next-line
		obs.on('TransitionEnd' as any, data => {
			this.transitionEnded(data as TransitionEndEventData);
		});
		obs.on('TransitionBegin', data => {
			this.transitionBegin(data as unknown as TransitionBeginEventData);
		});
		obs.on('ScenesChanged', () => this.updateScenes());
		obs.on('TransitionListChanged', () => this.updateTransitions());
		obs.on('ConnectionOpened', async () => {
			// this.updateCurrentScene();
			this.updateScenes();
			this.updateTransitions();
		});
		if(obs._connected) {
			this.updateScenes();
			this.updateTransitions();
		}
	},
	methods: {
		sceneChanged(data: SceneChangedEventData) {
			const scene = this.scenes.find(n => n.name === data.sceneName);
			this.currentScene = scene || null;
			this.applyOverrides();
		},
		async applyOverrides() {
			if(this.currentScene === null) {
				return;
			}
			const { name: sceneName } = this.currentScene;
			const { connections } = this;
			const testLink = (link: Connection) => {
				const fromAny = link.sceneFrom.type === 'any';
				const toAny = link.sceneTo.type === 'any';
				const matchesScene = link.sceneFrom.name === sceneName;
				const allWildcard = fromAny && toAny;
				return { fromAny, toAny, matchesScene, allWildcard };
			}
			const overrides: Record<string, Connection> = {};
			for(const link of connections) {
				const { fromAny, toAny, matchesScene, allWildcard } = testLink(link);
				if(allWildcard) {
					for(const { name, type } of this.scenes) {
						if(
							type !== 'any' &&
							name !== sceneName &&
							!overrides[name]
						) {
							overrides[name] = link;
						}
					}
				}
				else if(toAny && matchesScene) {
					for(const { name, type } of this.scenes) {
						if(
							type !== 'any' &&
							name !== sceneName &&
							(
								!overrides[name] ||
								testLink(overrides[name]).allWildcard
							)
						) {
							overrides[name] = link;
						}
					}
				}
				else if(fromAny) {
					const { name } = link.sceneTo;
					if(!overrides[name] || testLink(overrides[name]).allWildcard) {
						overrides[name] = link;
					}
				}
				else if(matchesScene) {
					const { name } = link.sceneTo;
					overrides[name] = link;
				}
			}
			for(const sceneName in overrides) {
				try {
					await setSceneTransitionOverride(
						overrides[sceneName],
						sceneName
					);
				} catch(err) {
					console.error(err);
				}
			}
		},
		transitionBegin(data: TransitionBeginEventData) {
			// TODO
			// console.log('Transition Began', data);
			// console.log(`${data.fromScene} -> ${data.toScene}`);
		},
		transitionEnded(data: TransitionEndEventData) {
			// console.log('Transition ended', data);
		},
		async updateScenes() {
			const anyScene: Scene = { name: 'Wildcard', type: 'any' };
			try {
				const { currentScene, scenes } = await getScenes();
				const scene = scenes.find(n => n.name === currentScene) || null;
				this.currentScene = scene;
				this.scenes = [ anyScene, ...scenes ];
				this.sceneChanged({ sceneName: currentScene });
			} catch(err) {
				console.error(err);
			}
		},
		async updateTransitions() {
			try {
				this.transitions = await getTransitions();
			} catch(err) {
				console.error(err);
			}
		},
		// async updateCurrentScene() {
		// 	const { name } = await obs.send('GetCurrentScene');
		// 	this.currentScene = this.scenes.find(n => n.name === name) || null;
		// },
		openEditor(connection?: EditorConnection) {
			const editor = this.$children.find(
				n => n.$options.name === 'ConnectionEditor'
			);
			editor && editor.$emit('clearErrors');
			const isEdit = !!connection;
			Object.assign(this.editor, { show: true, isEdit });
			if(!connection) {
				connection = generateEditorDefaults().connection;
			}
			const {
				title, sceneFrom, sceneTo, transition, duration, id
			} = connection;
			Object.assign(this.editor.connection, {
				title, sceneFrom, sceneTo, transition, duration, id
			});
			this.currentView = 'editor';
		},
		editorSubmit(respond: EditorSubmitRespond) {
			const { connection: c, isEdit } = this.editor;
			if(!c.sceneFrom || !c.sceneTo || !c.transition) {
				return;
			}
			const searchFunc = (n: Connection) =>
				n.sceneFrom.name === c.sceneFrom?.name &&
				n.sceneTo.name === c.sceneTo?.name;
			const existingConnection = this.connections.find(searchFunc);
			if(existingConnection && isEdit) {
				if(existingConnection.id !== c.id) {
					return respond('duplicate');
				}
				const copy: Partial<Connection> = {
					title: c.title,
					sceneFrom: c.sceneFrom,
					sceneTo: c.sceneTo,
					transition: c.transition,
					duration: c.duration
				};
				Object.assign(existingConnection, copy);
				respond('ok');
				this.applyOverrides();
			}
			else if(!existingConnection) {
				const connection: Connection = {
					title: c.title,
					sceneFrom: c.sceneFrom,
					sceneTo: c.sceneTo,
					transition: c.transition,
					duration: c.duration,
					id: generateConnectionID()
				};
				this.connections.push(connection);
				respond('ok');
				this.currentView = 'list';
				this.applyOverrides();
			}
			else {
				respond('duplicate');
			}
		},
		editorCancel() {
			this.currentView = 'list';
		},
		editorRemoved() {
			this.applyOverrides();
			this.currentView = 'list';
		}
	},
	data(): AppData {
		const data: AppData = {
			currentView: 'list',
			editor: generateEditorDefaults(),
			currentScene: null,
			currentTransition: null,
			scenes: [],
			transitions: [],
			// connections: []
			connections: [],
			obs
			// 	{
			// 		title: 'Intro',
			// 		sceneFrom: { name: 'Start Screen', type: 'scene' as const },
			// 		sceneTo: { name: 'Main', type: 'scene' as const },
			// 		transition: { name: 'Fade' },
			// 		duration: 500,
			// 		id: ''
			// 	},
			// 	{
			// 		title: 'A to B',
			// 		sceneFrom: { name: 'SceneA', type: 'scene' as const },
			// 		sceneTo: { name: 'SceneB', type: 'scene' as const },
			// 		transition: { name: 'A-To-B' },
			// 		duration: 0,
			// 		id: ''
			// 	},
			// 	{
			// 		title: '* to A',
			// 		sceneFrom: { name: 'Any Scene', type: 'any' as const },
			// 		sceneTo: { name: 'SceneA', type: 'scene' as const },
			// 		transition: { name: 'Any-To-A' },
			// 		duration: 0,
			// 		id: ''
			// 	}
			// ].map(n => {
			// 	n.id = generateConnectionID();
			// 	return n;
			// })
		};
		return data;
	},
	computed: {
		sceneName(): string | null {
			const { currentScene } = this;
			return currentScene ? currentScene.name : null;
		},
		headerTitle(): string {
			if(this.currentView === 'editor') {
				const { isEdit } = this.editor;
				return isEdit ? `Editing` : 'Create Connection';
			}
			else if(this.currentView === 'list') {
				return `Connections`;
			}
			else if(this.currentView === 'settings') {
				return 'Settings';
			}
			return 'Unknown view';
		},
		headerDetail(): string {
			if(this.currentView === 'editor') {
				const { isEdit, connection: { title } } = this.editor;
				return isEdit ? `"${title}"` : '';
			}
			else if(this.currentView === 'list') {
				return `(${this.sceneName || '?'})`;
			}
			else if(this.currentView === 'settings') {
				return '';
			}
			return '';
		},
		connectionStatus(): string {
			return obs._connected ? 'Connected' : 'Disconnected';
		}
	}
	// watch: {
	// 	currentScene(n, o) {
	// 		console.log(n, o);
	// 	}
	// }
});
</script>

<style lang="scss">
$white: hsl(0, 0%, 100%);

@import "./styles/vue-select.scss";

@import "./styles/button.scss";
@import "./styles/icon.scss";
@import "./styles/input.scss";

::-webkit-scrollbar {
	width: 8px;
	background: hsl(0, 0%, 12%);
	border-radius: 2px;
}
::-webkit-scrollbar-button {
	display: none;
}
::-webkit-scrollbar-thumb {
	background: hsl(0, 0%, 16%);
	border-radius: 2px;
}

body {
	background: hsl(0, 0%, 6%);
	color: $white;
	margin: 0;
	overflow-x: hidden;
	max-width: 600px;
	margin: 0 auto;

}

#app {
	font-family: Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	// color: #c4e1ff;
	margin: 0;
}

.header,
.body {
}

.header {
	display: flex;
	background: hsl(0, 0%, 24%);
	font-size: 1.15em;
	height: 30px;
	position: sticky;
	top: 0;
	z-index: 10;
	padding: 4px 6px;
	align-items: center;
	max-width: 100%;

	.header-title {
		margin-right: 0.25em;
		font-weight: bold;
		white-space: nowrap;
	}
	.header-detail {
		flex-grow: 1;
		color: darken($white, 20);
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.button,
	.obs-connection {
		flex-shrink: 0;
	}
	.button {
	}
	.obs-connection {
		width: 8px;
		height: 8px;
		margin: 0 4px;
		background: hsla(355, 86%, 61%, 0.95);
		box-shadow: 0px 0px 8px 2px hsla(355, 89%, 45%, 0.9);
		border-radius: 50%;

		&.connected {
			background: hsla(110, 81%, 58%, 0.6);
			box-shadow: 0px 0px 4px 2px hsla(110, 79%, 40%, 0.4);
		}
	}
}

.body {
	padding: 4px;

	&.no-padding {
		padding: 0;
	}
}
</style>