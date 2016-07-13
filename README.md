vue-vscroll
===========

A relatively simple virtual scrolling implementation for Vue.js


Building
--------

```bash
grunt
```


Usage
-----

```html
<ul v-scroll:windowedItems="items">
	<li v-for="item in windowedItems" track-by="id">
		{{ item.id }} ({{ $index }}): {{ item.name }}
	</li>
</ul>
```

If your items are not direct children of the element with the `v-scroll` directive, add the `v-scroll-item` class to
them so `v-scroll` can find them:

```html
<div v-scroll:windoweditems3="items">
	<table>
		<tr class="v-scroll-item" v-for="item in windoweditems3" track-by="id">
			<td>{{ item.id }}</td> <td>{{ $index }}</td> <td>{{ item.name }}</td>
		</tr>
	</table>
</div>
```

You can also set other attributes to control `v-scroll`'s behavior:

- `pagesPerChunk` - The number of pages of items (each the size of the viewport) to load each time we load a chunk
  (optional; default: 5)

- `pagesToScroll` - The number of pages around the center of a chunk to allow scrolling in without loading a new chunk;
  should be LESS THAN pagesPerChunk (optional; default: 3)

- `itemHeight` - The height, in pixels, of a single item (optional; if missing, this will be determined by looking at
  rendered items)
