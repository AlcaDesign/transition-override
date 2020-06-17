<template lang="pug">
	.settings
		//- .setting
			.setting-title
				.setting-icon
					.icon.delete_forever
				.title Delete multiple
			.setting-detail
				.button(@click="modals.deleteMultiple = true")
					.icon.delete_forever
					| Select connections to delete
		.setting
			.setting-title
				.setting-icon
					.icon.import_export
				.title Import/Export
			.setting-detail
				.button(@click="modals.import = true") Import
				.button(@click="modals.export = true") Export
		modal(:showing="modals.error" title="Error" :detail="errorDetail")
			template(v-slot:buttons)
				.button(@click="modals.error = false")
					.icon.close
					| Close
		modal.mega(:showing="modals.export" title="Export")
			template(v-slot:detail)
				textarea(
					v-model="exportData"
					placeholder="Export data"
					readonly
				)
			template(v-slot:buttons)
				.button(@click="modals.export = false")
					.icon.close
					| Close
		modal.mega(:showing="modals.import" title="Import")
			template(v-slot:detail)
				textarea(
					v-model="importData"
					placeholder="Paste data"
				)
			template(v-slot:buttons)
				.button(@click="importConfirm")
					.icon.import_export
					| Import
				.button(@click="importCancel")
					.icon.close
					| Cancel
		modal.mega(
			:showing="modals.importConfirm"
			title="Confirm connections."
		)
			template(v-slot:detail)
				ConnectionList(
					:features="{ search: false, edit: false, remove: true, sortable: false }"
					:connections="importConnections"
					@remove="removeImportConnection"
				)
			template(v-slot:buttons)
				.button(@click="importConfirmReplace")
					.icon.check
					| Replace
				//- TODO
				//- .button(@click="importConfirmAdd")
					.icon.check
					| Add
				.button(@click="importConfirmCancel")
					.icon.close
					| Cancel
		modal.mega(
			:showing="modals.deleteMultiple"
			title="Delete connections"
		)
			template(v-slot:detail)
				ConnectionList(
					:features="{ edit: false, select: true, sortable: false, create: false }"
					:connections="settings.connections"
				)
			template(v-slot:buttons)
				.button(@click="deleteMultipleConfirm")
					.icon.check
					| Select
				.button(@click="deleteMultipleCancel")
					.icon.close
					| Cancel
		modal(
			:showing="modals.deleteMultipleConfirm"
			title="Confirm selection for deletion"
			detail="This is permanent, are you sure?"
		)
			template(v-slot:buttons)
				.button.delete(@click="deleteMultipleConfirmConfirm")
					.icon.delete_forever
					| Delete
				.button(@click="deleteMultipleConfirmCancel")
					.icon.close
					| Cancel
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { Connection } from '../types';
import ConnectionList from './ConnectionList.vue';

interface Settings {
	connections: Connection[];
}

export default Vue.extend({
	name: 'Settings',
	components: {
		ConnectionList
	},
	props: {
		settings: {
			type: Object as PropType<Settings>,
			default: () => ({
				connections: []
			})
		}
	},
	methods: {
		importConfirm() {
			this.modals.import = false;
			const data = this.validateImport();
			if(data) {
				console.log('Valid import');
				this.importConnections = data;
				this.modals.importConfirm = true;
			}
			else {
				console.log('Invalid import');
			}
		},
		importCancel() {
			this.modals.import = false;
		},
		importConfirmReplace() {
			this.modals.importConfirm = false;
			this.importReplace();
		},
		importConfirmAdd() {
			this.modals.importConfirm = false;
			this.importAdd();
		},
		importConfirmCancel() {
			this.modals.importConfirm = false;
			this.modals.import = true;
		},
		validateImport() {
			const { importData: json } = this;
			if(json.length < 2) return console.log('Too short');
			const error = (message: string) => {
				this.errorDetail = message;
				this.modals.error = true;
			};
			let data: Connection[] = [];
			try {
				data = JSON.parse(json);
			} catch(err) {
				return error(err.message);
			}
			if(!Array.isArray(data)) {
				error('Could not read import data');
				return;
			}
			for(let i = 0; i < data.length; i++) {
				const link = data[i];
				const bad = (prop: string) => {
					error(`Bad ${prop} for item #${i + 1}`);
				};
				const validateScene = (prop: 'sceneFrom' | 'sceneTo') => {
					const value = link[prop];
					if(typeof value !== 'object') {
						bad(prop);
						return false;
					}
					if(typeof value.name !== 'string') {
						bad(`${prop}'s name`);
						return false;
					}
					if(
						typeof value.type !== 'string' ||
						(
							value.type !== 'scene' &&
							value.type !== 'any'
						)
					) {
						bad(`${prop}'s type`);
						return false;
					}
					return true;
				};
				if(
					typeof link.title !== 'string' ||
					!link.title ||
					link.title.length > 50
				) {
					return bad('title');
				}
				if(typeof link.id !== 'string' || link.id.length !== 8) {
					return bad('id');
				}
				if(
					typeof link.duration !== 'number' ||
					link.duration < 0 ||
					link.duration > Number.MAX_SAFE_INTEGER
				) {
					return bad('duration');
				}
				else if(link.duration !== Math.round(link.duration)) {
					link.duration = Math.round(link.duration);
				}
				if(!validateScene('sceneFrom')) {
					return;
				}
				if(!validateScene('sceneTo')) {
					return;
				}
				if(typeof link.transition !== 'object') {
					return bad('transition');
				}
				else if(typeof link.transition.name !== 'string') {
					return bad('transition name');
				}
				else if(
					// TODO
					typeof link.transition.type !== 'string' /* ||
					link.transition.type !== '' */
				) {
					return bad('transition type');
				}
			}
			return data;
		},
		importReplace() {
			// const data = this.validateImport();
			// if(data === undefined) {
			// 	return;
			// }
			this.importData = '';
			this.settings.connections.splice(0);
			this.settings.connections.push(...this.importConnections);
		},
		importAdd() {
			const data = this.validateImport();
			if(data === undefined) {
				return;
			}
			console.log('Add');
		},
		removeImportConnection(id: string) {
			// console.log('remove', id);
			const { importConnections: c } = this;
			const index = c.findIndex(n => n.id === id);
			c.splice(index, 1);
		},
		deleteMultipleConfirm() {
			this.modals.deleteMultiple = false;
			this.modals.deleteMultipleConfirm = true;
		},
		deleteMultipleCancel() {
			this.modals.deleteMultiple = false;
			// TODO: Reset selection
		},
		deleteMultipleConfirmConfirm() {
			this.modals.deleteMultipleConfirm = false;
			// TODO: Collect and delete selected connections
			// TODO: Reset selection? But it's already cleared 🤷‍♀️
		},
		deleteMultipleConfirmCancel() {
			this.modals.deleteMultipleConfirm = false;
			this.modals.deleteMultiple = true;
		}
	},
	data() {
		const importConnections: Connection[] = [];
		return {
			modals: {
				error: false,
				export: false,
				import: false,
				importConfirm: false,
				deleteMultiple: false,
				deleteMultipleConfirm: false
			},
			errorDetail: '',
			importData: '',
			importConnections
		};
	},
	computed: {
		exportData(): string {
			return JSON.stringify(this.settings.connections);
		}
	}
});
</script>

<style lang="scss">
.setting {
	// .setting-title,
	// .setting-detail {
	// }
	.setting-title {
		padding: 2px;
		display: flex;
		align-items: center;
		background: hsl(0, 0%, 12%);

		.setting-icon {
			padding: 4px;
			margin-right: 8px;
		}
		.title {
			font-weight: bold;
			font-size: 1.1em;
		}
	}
	.setting-detail {
		padding: 6px;
	}
}

.modal textarea,
.modal .connection-list {
	position: absolute;
	top: 8px;
	left: 8px;
	right: 8px;
	bottom: 8px;
}

.modal textarea {
	background: hsl(0, 0%, 4%);
	color: hsl(0, 0%, 100%);
	padding: 4px 8px;
	resize: none;
	// width: 90%;
	// height: 6em;
	width: calc(100% - 34px);
	font-size: 0.9em;
	font-family: monospace;
}

.modal .connection-list {
	// height: calc(100% - 8px);
	// position: absolute;
	// top: 0;
	// left: 0;
	// right: 0;
	// bottom: 0;
}
</style>