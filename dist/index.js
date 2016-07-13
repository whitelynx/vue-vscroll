'use strict';

/* global Vue:true */

var enableDebugging;
//enableDebugging = true;

function debugFunc(funcName) {
	return function () {
		if (enableDebugging) {
			console[funcName].apply(console, arguments);
		}
	};
}
var debug = debugFunc('log');
debug.group = debugFunc('group');
debug.groupEnd = debugFunc('groupEnd');

var Spacer = Vue.extend({
	template: '<div class="vscroll-content-spacer" :style="{ height: height, marginTop: marginTop, marginBottom: marginBottom }"></div>'
});

function getPx(style, key) {
	var value = style;
	if (key) {
		value = style.getPropertyValue(key);
	} // end if

	if (typeof value == 'number') {
		return value;
	} else {
		var match = /^([0-9.-]+)(?:px)?$/.exec(value);
		if (match) {
			return parseInt(match[1], 10);
		} // end if
	} // end if
} // end getPx

Vue.directive('scroll', {
	priority: 2000,

	params: [
	// The number of pages of items (each the size of the viewport) to load
	// each time we load a chunk (optional; default: 5):
	'pagesPerChunk',

	// The number of pages around the center of a chunk to allow scrolling
	// in without loading a new chunk; should be LESS THAN pagesPerChunk
	// (optional; default: 3):
	'pagesToScroll',

	// The height, in pixels, of a single item (optional; if missing, this
	// will be determined by looking at rendered items):
	'itemHeight'],

	bind: function bind() {
		debug.group('bind(', arguments, ')');try {
			var computedStyle = window.getComputedStyle(this.el, null);

			this.topSpacerData = { height: 0, marginTop: 0, marginBottom: 0 };
			this.topSpacer = new Spacer({ data: this.topSpacerData });
			this.topSpacer.$mount();
			if (this.el.childNodes.length > 0) {
				this.topSpacer.$before(this.el.childNodes[0]);
			} else {
				this.topSpacer.$appendTo(this.el);
			}

			this.bottomSpacerData = { height: 0, marginTop: 0, marginBottom: 0 };
			this.bottomSpacer = new Spacer({ data: this.bottomSpacerData });
			this.bottomSpacer.$mount();
			this.bottomSpacer.$appendTo(this.el);

			this.needItemHeightUpdate = false;
			this.itemHeight = getPx(this.params.itemHeight);
			if (!this.itemHeight) {
				this.itemHeight = getPx(computedStyle, 'line-height') || getPx(computedStyle, 'font-size') || 0;
				this.needItemHeightUpdate = true;
			} // end if

			this.pagesPerChunk = typeof this.params.pagesPerChunk == 'string' ? parseInt(this.params.pagesPerChunk, 10) : this.params.pagesPerChunk || 5;
			this.pagesToScroll = typeof this.params.pagesToScroll == 'string' ? parseInt(this.params.pagesToScroll, 10) : this.params.pagesToScroll || 3;

			this.itemsPerPage = 50;
			this.itemsPerChunk = this.itemsPerPage * this.pagesPerChunk;

			this.el.style.overflow = 'auto';

			this.checkScrollPosition = this.checkScrollPosition.bind(this);

			this.el.addEventListener('scroll', this.checkScrollPosition);
			this.el.addEventListener('wheel', this.checkScrollPosition);

			this.$scrollContext = {
				inScrollWindow: this.inScrollWindow.bind(this),
				items: []
			};

			this.windowedItems = [];

			this.windowedItemsKey = this.arg || '$scrollWindowedItems';
			debug("Setting vm.%s to:", this.windowedItemsKey, this.windowedItems);
			Vue.set(this._scope || this.vm, this.windowedItemsKey, this.windowedItems);

			if (this.descriptor.ref) {
				debug("Setting vm.$refs.%s to:", this.descriptor.ref, this);
				(this._scope || this.vm).$refs[this.descriptor.ref] = this;
			}
		} finally {
			debug.groupEnd();
		}
	},
	unbind: function unbind() {
		debug('unbind(', arguments, ')');
		this.el.removeEventListener('scroll', this.checkScrollPosition);
		this.el.removeEventListener('wheel', this.checkScrollPosition);
		if (this.descriptor.ref) {
			(this._scope || this.vm).$refs[this.descriptor.ref] = null;
		}
	},
	update: function update(items) {
		debug.group('update(', arguments, ')');try {
			this.items = items;

			this.updateItemHeight();

			this.updateWindowExtents();
		} finally {
			debug.groupEnd();
		}
	},
	inScrollWindow: function inScrollWindow(item, index) {
		debug('inScrollWindow(', arguments, ')');
		return index >= this.firstItemIndex && index <= this.lastItemIndex;
	},
	updateItemHeight: function updateItemHeight() {
		var _this = this;

		var tries = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

		debug.group('updateItemHeight(', tries, ')');try {
			if (this.pendingItemHeightUpdate) {
				return;
			} // end if

			if (tries > 10) {
				console.warn("Couldn't get actual height of child item after %s tries! Giving up.", tries);
			}

			if (this.needItemHeightUpdate) {
				this.pendingItemHeightUpdate = true;
				Vue.nextTick(function () {
					debug('updateItemHeight() => Vue.nextTick() callback');
					_this.pendingItemHeightUpdate = false;

					if (_this.el.children.length > 2) {
						var firstChildItem = _this.el.querySelector('.v-scroll-item') || _this.el.children[1];
						debug('firstChildItem:', firstChildItem);
						if (firstChildItem.offsetHeight > 0) {
							var computedItemStyle = window.getComputedStyle(firstChildItem, null);

							var marginTop = getPx(computedItemStyle, 'margin-top');
							var marginBottom = getPx(computedItemStyle, 'margin-bottom');

							_this.itemHeight = firstChildItem.offsetHeight + Math.max(marginTop, marginBottom);

							debug("Updating margins: top = %s, bottom = %s", marginTop, marginBottom);
							_this.topSpacerData.marginTop = marginTop;
							_this.topSpacerData.marginBottom = marginBottom;
							_this.bottomSpacerData.marginTop = marginTop;
							_this.bottomSpacerData.marginBottom = marginBottom;

							_this.needItemHeightUpdate = false;

							_this.updateWindowExtents();
						} else {
							// Child item has no height; try again later.
							setTimeout(function () {
								_this.updateItemHeight(tries + 1);
							}, 200);
						} // end if
					} // end if
				});
			} // end if
		} finally {
			debug.groupEnd();
		}
	},
	updateViewportInfo: function updateViewportInfo() {
		if (this.el.clientHeight != this.lastClientHeight) {
			debug.group('updateViewportInfo(', arguments, ')');try {
				this.lastClientHeight = this.el.clientHeight;

				this.itemsPerPage = Math.ceil(this.el.clientHeight / this.itemHeight);
				debug('this.itemsPerPage:', this.itemsPerPage);

				// Cache the configured number of items.
				this.itemsPerChunk = this.itemsPerPage * this.pagesPerChunk;
				debug('this.itemsPerChunk:', this.itemsPerChunk);
			} finally {
				debug.groupEnd();
			}
		}
	},
	checkScrollPosition: function checkScrollPosition() {
		var el = this.el;

		// Load a new chunk if the viewport has scrolled beyond the configured number of scrollable pages.
		if (!this.minScrollTop || el.scrollTop < this.minScrollTop || el.scrollTop > this.maxScrollTop) {
			this.updateWindowExtents();
		}
	},
	updateWindowExtents: function updateWindowExtents() {
		debug.group('updateWindowExtents(', arguments, ')');try {
			this.updateViewportInfo();

			var curScrollTop = this.el.scrollTop;

			// Figure out where the _middle_ of the viewport is.
			var scrollMid = curScrollTop + this.el.clientHeight / 2;
			// Figure out what item would be in the middle of the viewport.
			var itemIndexAtScrollMid = Math.floor(scrollMid / this.itemHeight);

			var itemsPerScrollArea = this.itemsPerPage * this.pagesToScroll;
			var scrollAreaHeight = itemsPerScrollArea * this.itemHeight;
			debug('itemsPerScrollArea:', itemsPerScrollArea);
			debug('scrollAreaHeight:', scrollAreaHeight);

			this.firstItemIndex = Math.floor(Math.max(0, itemIndexAtScrollMid - this.itemsPerChunk / 2));
			this.lastItemIndex = this.firstItemIndex + this.itemsPerChunk;
			debug('this.firstItemIndex:', this.firstItemIndex);
			debug('this.lastItemIndex:', this.lastItemIndex);

			var scrollAreaFirstItemIndex = this.firstItemIndex + (this.itemsPerChunk - itemsPerScrollArea) / 2;
			this.minScrollTop = scrollAreaFirstItemIndex * this.itemHeight;
			this.maxScrollTop = this.minScrollTop + scrollAreaHeight;
			debug('this.minScrollTop:', this.minScrollTop, 'this.maxScrollTop:', this.maxScrollTop);

			var topSpacerHeight = this.firstItemIndex * this.itemHeight;
			debug("Setting topSpacer's height to:", topSpacerHeight);
			this.topSpacerData.height = topSpacerHeight + 'px';
			var bottomSpacerHeight = Math.max(this.items.length - this.lastItemIndex, 0) * this.itemHeight;
			debug("Setting bottomSpacer's height to:", bottomSpacerHeight);
			this.bottomSpacerData.height = bottomSpacerHeight + 'px';

			this.updateWindowedItems();
		} finally {
			debug.groupEnd();
		}
	},
	updateWindowedItems: function updateWindowedItems() {
		debug.group('updateWindowedItems(', arguments, ')');try {
			debug('Slicing items from %s to %s...', this.firstItemIndex, this.lastItemIndex);

			this.windowedItems.splice.apply(this.windowedItems, [0, this.windowedItems.length].concat(this.items.slice(this.firstItemIndex, this.lastItemIndex)));

			debug('this.windowedItems:', this.windowedItems);
		} finally {
			debug.groupEnd();
		}
	}
});
//# sourceMappingURL=index.js.map
