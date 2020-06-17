<template lang="pug">
	.connection-list.body.no-padding
		.connection-search(v-if="_features.search")
			.icon.search(:class="{ searching: isFiltered }")
			input.search-connections(
				type="search"
				placeholder="Search"
				v-model="searchText"
			)
			.button.icon.checkbox(
				@click="searchTitleOnly = !searchTitleOnly"
				:checked="searchTitleOnly"
			)
				tipped.left Search title only
				.icon.title
			.button.icon(@click="$emit('openEditor')" v-if="_features.create")
				tipped.bottom.left Create connection
				.icon.add
		draggable.connection-list-section(
			:list="filteredList"
			:disabled="!_features.sortable"
			@change="listDragged"
		)
			connection-item(
				v-for="c in connections"
				v-show="filteredList.includes(c)"
				:key="c.id"
				:connection="c"
				:currentSceneName="sceneName"
				:features="_features"
				@openEditor="c => $emit('openEditor', c)"
				@remove="id => $emit('remove', id)"
				@checked="(id, state) => $emit('checked', id, state)"
			)
</template>

<script lang="ts">
import { Connection, Scene, ConnectionListFeatures } from '../types';
import store from '../storage';

import Vue, { PropType } from 'vue';
import Draggable from 'vuedraggable';

import ConnectionItem from './sub/ConnectionItem.vue';

interface DraggableChangeEvent {
	added?: {
		newIndex: number;
		element: Connection;
	};
	removed?: {
		oldIndex: number;
		element: Connection;
	};
	moved?: {
		newIndex: number;
		oldIndex: number;
		element: Connection;
	};
}

export default Vue.component('ConnectionList', {
	components: {
		Draggable,
		ConnectionItem
	},
	props: {
		features: {
			type: Object as PropType<ConnectionListFeatures>,
			default: () => ({
				search: true,
				edit: true,
				remove: false,
				select: false,
				sortable: true
			} as ConnectionListFeatures)
		},
		search: {
			type: Boolean as PropType<boolean>,
			default: true
		},
		edit: {
			type: Boolean as PropType<boolean>,
			default: true
		},
		remove: {
			type: Boolean as PropType<boolean>,
			default: false
		},
		connections: {
			type: Array as PropType<Connection[]>
		},
		currentScene: {
			type: Object as PropType<Scene | null>,
			default: null
		}
	},
	created() {
		const searchTitleOnly = store.remember('searchTitleOnly', () => true);
		this.searchTitleOnly = Boolean(searchTitleOnly);
		this.$watch('searchTitleOnly', (/* newValue, oldValue */) => {
			store.set('searchTitleOnly', this.searchTitleOnly);
		}, { deep: true });
	},
	data() {
		return {
			searchText: '',
			searchTitleOnly: true
		};
	},
	methods: {
		listDragged(change: DraggableChangeEvent) {
			if(change.moved) {
				const { newIndex, oldIndex } = change.moved;
				const { connections: c } = this;
				c.splice(newIndex, 0, c.splice(oldIndex, 1)[0]);
			}
		}
	},
	computed: {
		_features(): ConnectionListFeatures {
			const get = (key: keyof ConnectionListFeatures, def: boolean) => {
				const v = this.features[key];
				return v === undefined ? def : v;
			};
			return {
				search: get('search', true),
				edit: get('edit', true),
				remove: get('remove', false),
				select: get('select', false),
				sortable: get('sortable', true),
				create: get('create', true)
			};
		},
		sceneName(): string | null {
			const { currentScene } = this;
			return currentScene ? currentScene.name : null;
		},
		filteredList: {
			get(): Connection[] {
				const search = this.searchText.toLowerCase();
				let func = (n: Connection) =>
					n.title.toLowerCase().includes(search);
				if(!this.searchTitleOnly) {
					func = (n: Connection) =>
						n.title.toLowerCase().includes(search) ||
						n.sceneFrom.name.toLowerCase().includes(search) ||
						n.sceneTo.name.toLowerCase().includes(search) ||
						n.transition.name.toLowerCase().includes(search);
				}
				return this.connections.filter(func);
			},
			// eslint-disable-next-line
			set(value: Connection[]) {}
		},
		isFiltered(): boolean {
			return this.searchText.length > 0;
		}
	}
});
</script>

<style lang="scss">

.connection-list {
	.body {
		padding: 0 0 4px 0;
	}
}

.connection-search {
	background: hsl(0, 0%, 6%);
	display: flex;
	align-items: center;
	padding: 4px 0;
	position: sticky;
	// 38 for header
	top: 38px;
	z-index: 15;

	.icon.search {
		margin-left: 4px;
	}
	input {
		flex: 1;
		margin: 0 6px;
	}
	.button.icon:last-child {
		margin-right: 4px;
	}
}

.connection-list-section {
	height: 100%;
	overflow-y: auto;

	&:empty {
		text-align: center;

		&:before {
			content: 'No connections.';
			opacity: 0.3;
			font-style: italic;
		}
	}
	.connection-item {
		// Also defined in the component
	}
}

.connection-search + .connection-list-section {
	height: calc(100% - 42px);
}

.icon.search.searching {
	background: hsl(225, 68%, 44%);
}
</style>