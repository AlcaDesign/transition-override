<template lang="pug">
	//- https://codepen.io/Alca/pen/LWBzVw
	.tip #[slot]
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.component('Tipped', {
	mounted() {
		(this.$el.parentElement as HTMLElement).classList.add('tipped');
	}
});
</script>

<style lang="scss">
.tipped {
	// display: none;
	position: relative;
	--tip-delay: 100ms;

	.tip {
		font-size: 10px;
		line-height: 22px;
		opacity: 0;
		background-color: hsl(225, 29%, 32%);
		border-radius: 2px;
		white-space: nowrap;
		padding: 0 8px;
		height: 22px;
		overflow: hidden;
		display: inline-block;
		position: absolute;
		pointer-events: none;
		z-index: 1000;
		animation-delay: var(--tip-delay);
		animation-duration: 300ms;
		animation-timing-function: cubic-bezier(0.0, 0.0, 0.2, 1);
		transition: opacity 300ms 0ms;
		// shape-outside: border-box;

		&,
		&.top {
			top: -18px;
			left: 50%;
			transform: translate(-50%, -50%);
		}
		&.left {
			top: 50%;
			left: -8px;
			transform: translate(-100%, -50%);
		}
		&.right {
			top: 50%;
			left: 100%;
			transform: translate(8px, -50%);
		}
		&.bottom {
			top: 100%;
			left: 50%;
			transform: translate(-50%, 8px);

			&.left {
				left: 50%;
				transform: translate(-100%, 8px);
			}
			&.right {
				left: 100%;
				transform: translate(8px, 8px);
			}
		}
	}
	&:hover > .tip {
		opacity: 1;
		transition-delay: var(--tip-delay);

		&,
		&.top {
			animation-name: tooltip-reveal-top;
		}
		&.left {
			animation-name: tooltip-reveal-left;
		}
		&.right {
			animation-name: tooltip-reveal-right;
		}
		&.bottom {
			animation-name: tooltip-reveal-bottom;

			&.left {
				animation-name: tooltip-reveal-bottom-left;
			}
			&.right {
				animation-name: tooltip-reveal-bottom-right;
			}
		}
	}
}
@keyframes tooltip-reveal-top {
	0% {
		clip-path: circle(0px at 50% 20px);
		opacity: 1;
	}
	100% {
		clip-path: circle(100% at 50% 20px);
		opacity: 1;
	}
}
@keyframes tooltip-reveal-bottom {
	0% {
		clip-path: circle(0px at 50% 0);
		opacity: 1;
	}
	100% {
		clip-path: circle(100% at 50% 0);
		opacity: 1;
	}
}
@keyframes tooltip-reveal-left {
	0% {
		clip-path: circle(0px at 100% 50%);
		opacity: 1;
	}
	100% {
		clip-path: circle(150% at 100% 50%);
		opacity: 1;
	}
}
@keyframes tooltip-reveal-right {
	0% {
		clip-path: circle(0px at 0% 50%);
		opacity: 1;
	}
	100% {
		clip-path: circle(150% at 0% 50%);
		opacity: 1;
	}
}
@keyframes tooltip-reveal-bottom-left {
	0% {
		clip-path: circle(0px at 100% 0);
		opacity: 1;
	}
	100% {
		clip-path: circle(150% at 100% 0);
		opacity: 1;
	}
}
@keyframes tooltip-reveal-bottom-right {
	0% {
		clip-path: circle(0px at 0% 0);
		opacity: 1;
	}
	100% {
		clip-path: circle(150% at 0% 0);
		opacity: 1;
	}
}
</style>