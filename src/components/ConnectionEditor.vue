<template lang="pug">
	#connection-editor
		.body
			.editor-group
				label.icon.title(:error="errors.title")
					tipped.right Title
				input(
					type="text"
					v-model="editor.connection.title"
					placeholder="Title"
					maxlength="50"
				)
			.editor-group
				label.icon.photo(:error="errors.sceneFrom")
					tipped.right From Scene
				v-select(
					label="name"
					:options="scenes"
					:selectable="selectable('a')"
					v-model="editor.connection.sceneFrom"
					:class="{ required: !!editor.connection.sceneFrom }"
					placeholder="From Scene"
					no-options="No scenes available"
				)
			.editor-group
				label.icon.toll(:error="errors.transition")
					tipped.right Transition
				v-select(
					label="name"
					:options="transitions"
					v-model="editor.connection.transition"
					placeholder="Transition"
					no-options="No transitions available"
				)
				div(v-show="isFade")
					tipped.left Duration (ms)
					input#duration(
						type="number"
						v-model.number="editor.connection.duration"
						@change="durationChanged"
						min="0"
						step="1"
						placeholder="Duration (ms)"
					)
			.editor-group
				.icon.photo(:error="errors.sceneTo")
					tipped.right To Scene
				v-select(
					label="name"
					:options="scenes"
					:selectable="selectable('b')"
					v-model="editor.connection.sceneTo"
					placeholder="To Scene"
					no-options="No scenes available"
				)
			.editor-group
				.button.icon(@click="swapScenes")
					tipped.right Swap scenes
					.icon.swap-vert
				.filler
				.button(@click="submit")
					.icon.edit
					| {{ editor.isEdit ? 'Edit' : 'Create' }}
				.button.delete(
					@click="startRemove"
					v-show="editor.isEdit"
				)
					.icon.delete_forever
					| Delete
				.button(@click="cancel")
					.icon.close
					| Cancel
		modal(
			:showing="modalDeleteShowing"
			title="Delete connection"
			:detail="modalDeleteDetail"
			:buttons="modalDeleteButtons"
		)
		modal(
			:showing="modalDuplicateShowing"
			:title="modalDuplicateTitle"
			:buttons="modalDuplicateButtons"
		)
	</div>
</template>

<script lang="ts">
import { Editor, Transition, Connection, EditorSubmitResponse } from '../types';

import Vue, { PropType } from 'vue';
import vSelect from 'vue-select';
import Modal, { ModalButton } from './sub/Modal.vue';

import { generateEditorDefaults } from '../utils';
import { Scene } from 'obs-websocket-js';

export default Vue.extend({
	name: 'ConnectionEditor',
	components: {
		vSelect,
		Modal
	},
	props: {
		editor: {
			type: Object as PropType<Editor>,
			default: generateEditorDefaults
		},
		transitions: {
			type: Array as PropType<Transition[]>
		},
		scenes: {
			type: Array as PropType<Scene[]>
		},
		connections: {
			type: Array as PropType<Connection[]>
		}
	},
	methods: {
		close() {
			this.editor.show = false;
		},
		cancel() {
			this.close();
			this.$emit('cancel');
		},
		remove() {
			const { connections: c } = this;
			const { id } = this.editor.connection;
			const index = c.findIndex(n => n.id === id);
			c.splice(index, 1);
			this.close();
			this.$emit('removed');
		},
		startRemove() {
			this.modalDeleteShowing = true;
		},
		submit() {
			const { errors } = this;
			const { connection: c } = this.editor;
			// const markError = (name: string) => {
			// 	const el = this.$refs[name];
			// 	if(el instanceof Element) {
			// 		const icon = el.parentElement?.querySelector('.icon');
			// 		icon?.setAttribute('error', 'error');
			// 	}
			// };
			this.clearErrors();
			let good = true;
			const bad = (name: keyof typeof errors) => {
				good = false;
				this.errors[name] = true;
			};
			if(!c.title) {
				bad('title');
			}
			if(!c.sceneFrom) {
				bad('sceneFrom');
			}
			if(!c.sceneTo) {
				this.errors.sceneTo = true;
				bad('sceneTo');
			}
			if(!c.transition) {
				this.errors.transition = true;
				bad('transition');
			}
			else if(c.transition.name === 'Fade' && c.duration < 0) {
				good = false;
				console.log('Transition is fade but duration is invalid');
				// bad('duration');
			}
			if(good) {
				this.$emit('submit', (response: EditorSubmitResponse) => {
					if(response === 'ok') {
						this.close();
					}
					else if(response === 'duplicate') {
						this.modalDuplicateShowing = true;
					}
					else {
						console.log('Not good');
					}
				});
			}
		},
		selectable(id: string) {
			const opposite = id === 'a' ? 'sceneTo' : 'sceneFrom';
			return (option: { name: string }): boolean => {
				const oppo = this.editor.connection[opposite];
				const oppoVal = oppo ? oppo.type : null;
				return oppoVal === 'any' || option.name !== oppoVal;
			};
		},
		swapScenes() {
			const { connection: c } = this.editor;
			const { sceneFrom, sceneTo } = c;
			c.sceneFrom = sceneTo;
			c.sceneTo = sceneFrom;
		},
		durationChanged() {
			const { connection: c } = this.editor;
			const { duration } = c;
			if(typeof duration !== 'number') {
				c.duration = 0;
			}
			else if(duration < 0) {
				c.duration = 0;
			}
			else {
				c.duration = Math.trunc(duration);
			}
		},
		clearErrors() {
			const { errors } = this;
			const keys = Object.keys(errors);
			keys.forEach(
				key => this.errors[key as keyof typeof errors] = false
			);
		}
	},
	mounted() {
		this.$on('clearErrors', this.clearErrors);
	},
	data() {
		type ErrorKeys = 'title' | 'sceneFrom' | 'sceneTo' | 'transition';
		const errors: Record<ErrorKeys, boolean> = {
			title: false,
			sceneFrom: false,
			sceneTo: false,
			transition: false
		};
		const modalDeleteButtons: ModalButton[] = [];
		const modalDuplicateButtons: ModalButton[] = [];
		return {
			errors,
			modalDeleteShowing: false,
			modalDeleteButtons,
			modalDuplicateShowing: false,
			modalDuplicateButtons
		};
	},
	created() {
		const closeModalDelete = () => this.modalDeleteShowing = false;
		this.modalDeleteButtons = [
			{ name: 'Delete', type: 'delete', click: () => (this.remove(), closeModalDelete()) },
			{ name: 'Cancel', type: 'cancel', click: closeModalDelete }
		];
		this.modalDuplicateButtons = [
			{ name: 'Close', type: 'cancel', click: () => this.modalDuplicateShowing = false }
		];
	},
	computed: {
		isFade(): boolean {
			const { transition } = this.editor.connection;
			return transition !== null && transition.name === 'Fade';
		},
		modalDeleteDetail(): string {
			const { title } = this.editor.connection;
			return `Are you sure you want to delete "${title}"?`;
		},
		modalDuplicateTitle(): string {
			return 'This is a duplicate connection';
		}
	}
});
</script>

<style lang="scss">
.editor-group,
.v-select {
	& + &,
	& + .editor-group,
	.editor-group + &,
	& + .button {
		margin-top: 6px;
	}
}

.editor-group {
	display: flex;
	align-content: stretch;
	align-items: center;

	.filler {
		flex: 1;
	}
	.v-select,
	input {
		flex: 1;
	}
	div,
	label,
	.v-select {
		& + .v-select,
		& + input {
			margin-left: 6px;
		}
		& + input#duration {
			max-width: 100px;
		}
	}
}
</style>