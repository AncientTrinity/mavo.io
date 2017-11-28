(function() {

Mavo.hooks.add("markdown-render-before", function(env) {
	env.markdown = env.markdown.replace(/^(Note|Tip|Warning): /mig, function($0, $1) {
		return "<p class=" + $1.toLowerCase() + ">";
	});
});

document.addEventListener("mv-markdown-render", function(evt) {
	// Create live demos
	var s = Mavo.selectors;
	var demoHeading = "h2[id^=demo], h6";
	var selector = s.and(demoHeading, " + pre, + p + pre");
	selector = s.and(selector, "> code.language-markup, > code.language-html")

	$$(selector, evt.target).forEach(function createLiveDemo(code) {
		var html = code.textContent;
		var pre = code.parentNode;
		var mavoURL = "https://dev.mavo.io/dist";
		var css = "";

		html = html.replace(/<style>([\S\s]+?)<\/style>\s*$/i, ($0, $1) => {
			css = $1;
			return "";
		});

		css = css.trim();

		// Drop CSS from visible example
		if (html != code.textContent) {
			code.textContent = html;
		}

		if (html.indexOf("mv-app") === -1) {
			html = `<div mv-app mv-storage="local">
${html}
</div>`;
		}

		var demoHTML = `<!DOCTYPE html>
<head>
<link rel="stylesheet" href="${mavoURL}/mavo.css" />
<script src="${mavoURL}/mavo.js"></script>
<style>
${css}
</style>
</head>
<body>
${html}
</body>`;

		var siblings = [], ps = pre;

		do {
			siblings.unshift(ps = ps.previousElementSibling);
		} while (ps && !ps.matches(demoHeading));

		var iframe = $.create("iframe", {
			srcdoc: demoHTML,
			onload: function(evt) {
				updateIframeHeight();

				$.events(iframe.contentDocument, "mv-load mv-change mv-edit mv-done", updateIframeHeight);
			}
		});

		function updateIframeHeight() {
			requestAnimationFrame(function() {
				var h = iframe.contentDocument.documentElement.offsetHeight;
				iframe.style.height = h + "px";
			});
		}

		var container = $.create("section", {
			className: "example side-by-side",
			contents: [
				{
					className: "demo-container",
					contents: [
						pre,
						{
							className: "example-container",
							contents: iframe
						}
					]
				}
			],
			after: ps
		});

		var heading = siblings[0];
		var play = $.create("form", {
			action: "https://codepen.io/pen/define",
			method: "POST",
			target: "_blank",
			contents: [
				{
					tag: "input",
					type: "hidden",
					name: "data",
					value: Mavo.toJSON({
						title: heading.textContent,
						html: html,
						css: css,
						css_external: mavoURL + "/mavo.css",
						js_external: mavoURL + "/mavo.es5.js",
						editors: "1100"
					})
				},
				{
					tag: "button",
					textContent: "Play!",
					title: "Play with this example on codepen.io"
				}
			],
			inside: heading
		});

		$.start(siblings, container);
	});

	// Highlight code areas
	requestAnimationFrame(() => {
		$$("code", evt.target).forEach(function(element) {
			if (!element.parentNode.matches("pre")) {
				element.innerHTML = element.innerHTML.replace(/[A-Z_]{6,}/g, "<em>$&</em>");
			}

			Prism.highlightElement(element);
		});
	});
});

})();