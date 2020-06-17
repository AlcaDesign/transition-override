<template lang="pug">
	.modal(
		v-show="showing"
	)
		.modal-shim
		.modal-body
			//- .modal-header
			.modal-title {{ title }}
			.modal-detail
				slot(name="detail") {{ detail }}
			.modal-buttons
				slot(name="buttons")
					.button(
						v-for="b of buttons"
						:key="b.name"
						@click="b.click(b)"
						:class="{ [b.type || '']: true }"
					)
						.icon(:class="{ [iconTypes[b.type] || b.type || b.icon || '']: true }")
						| {{ b.name }}
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

export interface ModalButton {
	type?: 'submit' | 'delete' | 'cancel';
	icon?: string;
	name: string;
	// eslint-disable-next-line
	click: () => any;
}

export default Vue.component('Modal', {
	props: {
		showing: {
			type: Boolean as PropType<boolean>,
			default: false
		},
		title: {
			type: String as PropType<string>,
			default: ''
		},
		detail: {
			type: String as PropType<string>,
			default: ''
		},
		buttons: {
			type: Array as PropType<ModalButton[]>,
			default: () => []
		}
	},
	data() {
		return {
			iconTypes: {
				submit: 'check',
				delete: 'delete_forever',
				cancel: 'close'
			}
		};
	}
});
</script>

<style lang="scss" scoped>
.modal,
.modal-shim {
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}
.modal {
	position: fixed;
	z-index: 100000;
	
	&.mega .modal-body {
		width: 95vw;
		height: 95vh;
	}
}
.modal-shim {
	background: hsla(0, 0%, 0%, 0.8);
	position: absolute;
	z-index: 100001;
}
.modal-body {
	// display: flex;
	// flex-direction: column;
	display: grid;
	grid-template-rows: fit-content(10px) auto 42px;
	background: hsl(0, 0%, 20%);
	border-radius: 4px;
	overflow: hidden;
	position: absolute;
	z-index: 100002;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
// .modal-header {
// 	padding: 10px;
// 	overflow-wrap: break-word;
// }
.modal-title,
.modal-detail {
	overflow-wrap: break-word;
	padding: 10px;
}
.modal-title {
	font-size: 1.2em;
	font-weight: bold;
	// margin-bottom: 0.5em;
}
.modal-detail {
	// flex-shrink: 1;
	// height: 100%;
	position: relative;
}
.modal-buttons {
	// margin-top: auto;
	padding: 6px;
	display: flex;
	justify-content: flex-end;
	background: hsl(0, 0%, 8%);
}
// .modal-button {}
</style>
