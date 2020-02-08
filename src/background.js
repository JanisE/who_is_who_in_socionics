const api = chrome;
const storage = api.storage.local;

// Send replacement lists to the given tab id.
function startReplaceServiceInTab (id, onDone)
{
	storage.get({sociotypes_parsed: []}, (data) =>
	{
		api.tabs.sendMessage(id, {
			event: 'who_is_who_in_socionics.service_is_enabled',
			sociotypes_parsed: (typeof data.sociotypes_parsed === 'object' ? data.sociotypes_parsed : [])
		}, function ()
		{
			if (typeof onDone === 'function') {
				onDone();
			}
		});
	});
}

function stopReplaceServiceInTab (id, onDone)
{
	api.tabs.sendMessage(id, {
		event: 'who_is_who_in_socionics.service_is_disabled'
	}, function ()
	{
		if (typeof onDone === 'function') {
			onDone();
		}
	});
}

function escapeRegexp (literal)
{
	return literal.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&');
}

function parseRawInput (text)
{
	const lines = text.split('\n');
	const count = lines.length;

	const types = {};
	const rgLine = /^\s*([-*]\s*(.+?)|([^#].*?))\s*$/;
	let currentType = null;

	for (let i = 0; i < count; i++) {
		const lineParts = lines[i].match(rgLine);

		if (lineParts) {
			// Type header.
			if (lineParts[3]) {
				currentType = lineParts[3];
			}
			// Person name.
			else if (currentType) {
				if (!(currentType in types)) {
					types[currentType] = new Set();
				}

				types[currentType].add(lineParts[2]);
			}
			// Else: Skip person if no type is set.
		}
		//Else: Skip empty lines or comments.
	}

	const replacements = [];
	Object.keys(types).forEach(type =>
	{
		const people = [... types[type]];
		for (let j = people.length - 1; j >= 0; j--) {
			replacements.push({
				// \b works only for Latin letters. To support Unicode letters, the RegExp would be much more complicated (and slower).
				//from: '\\b' + escapeRegexp(people[j]).replace(/ +/g, ' ').replace(' ', ' +') + '\\b',
				from: escapeRegexp(people[j]).replace(/ +/g, ' ').replace(' ', ' +'),
				to: people[j] + ' (' + type + ')'
			});
		}
	});

	// Sort by length, so the longer replacements are done first (they are used in a reverse order, in `performReplacements`).
	// For example, match `Napoleons III` and then `Napoleons`. If the other way around, the longer match will not happen.
	// The result in this particular example is not the best, but it's better than only the short regex matching.
	replacements.sort((valueA, valueB) => valueA.from.length - valueB.from.length);

	return replacements;
}

// Listen to messages from content scripts.
api.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	switch (message.event) {
	case 'who_is_who_in_socionics.page_loaded':
		storage.get({paused: false}, data =>
		{
			if (!data.paused) {
				startReplaceServiceInTab(sender.tab.id, sendResponse);
			}
		});
		break;

	case 'who_is_who_in_socionics.replacement_count_updated':
		api.browserAction.setBadgeText({
			text: (message.totalReplacedCount > 9999 ? 9999 : message.totalReplacedCount).toString(),
			tabId: sender.tab.id
		});
		sendResponse();
		break;

	case 'who_is_who_in_socionics.popup_loaded':
		storage.get({paused: false}, data =>
		{
			sendResponse({paused: !!data.paused});
		});
		break;

	// When toggling the service, change the icon and update the current tab.
	case 'who_is_who_in_socionics.service_enabled':
	case 'who_is_who_in_socionics.service_disabled':
		api.tabs.query({active: true, currentWindow: true}, function (tabs)
		{
			// TODO This is a global setting. How can we send service_disabled message to all tabs that the extension is loaded in?
			storage.get({paused: false}, function (data)
			{
				if (!data.paused && message.event === 'who_is_who_in_socionics.service_disabled') {
					storage.set({paused: true});
					stopReplaceServiceInTab(tabs[0].id, sendResponse);
					api.browserAction.setIcon({path: {48: "ui/icon-disabled.png"}});
					//api.tabs.reload(sender.tab.id);
				}
				else if (!!data.paused && message.event === 'who_is_who_in_socionics.service_enabled') {
					storage.set({paused: false});
					api.browserAction.setIcon({path: {48: "ui/icon.png"}});
					startReplaceServiceInTab(tabs[0].id, sendResponse);
				}
				// Else: Do nothing if the status already matches the request.
			});
		});
		break;

	case 'who_is_who_in_socionics.sociotypes_updated':
	case 'who_is_who_in_socionics.autoloaded_sociotypes_updated':
		storage.set({
			[message.event === 'who_is_who_in_socionics.sociotypes_updated' ? 'sociotypes_raw' : 'sociotypes_autoloaded_raw']: message.data,
		}, function ()
		{
			storage.get({sociotypes_raw: '', sociotypes_autoloaded_raw: ''}, data =>
			{
				storage.set({
					sociotypes_parsed: parseRawInput(data.sociotypes_raw + '\n' + data.sociotypes_autoloaded_raw)
				}, function ()
				{
					storage.get({paused: false}, function (data)
					{
						if (!data.paused) {
							api.tabs.query({active: true, currentWindow: true}, function (tabs)
							{
								startReplaceServiceInTab(tabs[0].id, sendResponse); // Restarts if already started.
							});
						}
						else {
							sendResponse();
						}
					});
				});
			});
		});
		break;
	}

	return true; // Declares async execution.
});
