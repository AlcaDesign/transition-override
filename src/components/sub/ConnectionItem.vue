<template lang="pug">
	.connection-item(:class="{ used, wildcard }")
		.connection-title {{ connection.title }}
		.connection-detail(
			:class="{ any: connection.sceneFrom.type === 'any' }"
		)
			| {{ connection.sceneFrom.name }}
		.connection-detail {{ connection.transition.name }}
		//- .connection-detail {{ connection.sceneTo.name }}
		.connection-detail(
			:class="{ any: connection.sceneTo.type === 'any' }"
		)
			| {{ connection.sceneTo.name }}
		//- .search-context {{ connection[matched] }}
		.button.icon(
			@click="$emit('openEditor', connection)"
			v-if="features.edit"
		)
			tipped.left Edit connection
			.icon.edit
		.button.icon(
			@click="$emit('remove', connection.id)"
			v-if="features.remove"
		)
			tipped.left Remove connection
			.icon.close
		.button.icon.checkbox(
			@click="checkClicked"
			:checked="isChecked"
			v-if="features.select"
		)
			tipped.left Select connection
			.icon.check_box
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { Connection, ConnectionListFeatures } from '../../types';

type Features = Omit<ConnectionListFeatures, 'search'>;

export default Vue.component('connection-item', {
	name: 'ConnectionItem',
	props: {
		features: {
			type: Object as PropType<Features>,
			default: () => ({
				edit: true,
				remove: false,
				select: true
			} as Features)
		},
		connection: {
			type: Object as PropType<Connection>
		},
		currentSceneName: {
			type: String
		},
		checked: {
			type: Boolean as PropType<boolean>,
			default: false
		}
	},
	created() {
		this.isChecked = this.checked;
	},
	methods: {
		checkClicked() {
			this.isChecked = !this.isChecked;
			this.$emit('checked', this.connection.id, this.checked);
		}
	},
	data() {
		return {
			isChecked: false
		};
	},
	computed: {
		used(): boolean {
			const { sceneFrom, sceneTo } = this.connection;
			return sceneFrom.name === this.currentSceneName ||
			sceneFrom.type === 'any' || sceneTo.type === 'any';
		},
		wildcard(): boolean {
			const { sceneFrom, sceneTo } = this.connection;
			return sceneFrom.type === 'any' || sceneTo.type === 'any';
		}
	}
});
</script>

<style lang="scss">
.connection-item {
	display: grid;
	height: 30px;
	background: hsl(0, 0%, 12%);
	border: 1px solid hsl(0, 0%, 16%);
	border-left: 0;
	border-right: 0;
	// box-sizing: border -box;
	align-items: stretch;
	grid-template-columns: 40% 1fr 1fr 1fr 30px;
	gap: 0 4px;
	overflow: hidden;

	& + & {
		border-top: 0;
	}
	&:nth-child(odd) {
		background: hsl(0, 0%, 10%);
	}
	&:hover {
		background: hsl(0, 0%, 16%);
	}
	// &.wildcard
	&.used {
		$color1: hsla(225, 70%, 50%, 0.7);
		$color2: hsla(225, 60%, 30%, 0.5);
		$color3: rgba(0, 0, 0, 0.1);
		.connection-title {
			background: linear-gradient(
				90deg,
				$color1 2px,
				$color2 6px,
				$color3 60px
			);
		}
		// &.wildcard .connection-title {
		// 	background: linear-gradient(
		// 		90deg,
		// 		$color1 2px,
		// 		$color2 6px,
		// 		$color3 20px
		// 	);
		// }
	}
	// &.sortable-chosen {
	// }
	.button.icon {
		padding: 2px;
	}
}

.connection-title,
.connection-detail {
	display: flex;
	align-items: center;
	padding-left: 6px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	cursor: default;
}

.connection-title {
	font-size: 0.9em;
	// flex: 1;
	cursor: default;
}

.connection-detail {
	opacity: 0.7;
	font-size: 0.8em;
	background: linear-gradient(90deg, hsla(0, 0%, 0%, 0.5), hsla(0, 0%, 8%, 0.1) 20%);
	border-left: 1px solid hsl(0, 0%, 20%);

	&.any {
		&:before {
			font-weight: bold;
			content: '*';
			color: yellow;
			margin-right: 4px;
		}
	}
}

.connection-item:hover .connection-detail {
	opacity: 1;
	background: linear-gradient(90deg, hsla(0, 0%, 0%, 0.2), hsla(0, 0%, 8%, 0.1) 20%);

	// &:nth-child(even) {
	// 	background: hsl(0, 0%, 10%);
	// }
}
</style>