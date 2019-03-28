const api = chrome;
const storage = api.storage.local;

// Send replacement lists to the given tab id.
function startReplaceServiceInTab (id)
{
	storage.get({sociotypes_parsed: []}, (data) =>
	{
		api.tabs.sendMessage(id, {
			event: 'who_is_who_in_socionics.service_is_enabled',
			sociotypes_parsed: data.sociotypes_parsed
		});
	});
}

function stopReplaceServiceInTab (id)
{
	api.tabs.sendMessage(id, {
		event: 'who_is_who_in_socionics.service_is_enabled'
	});
}

// Listen to messages from content scripts.
api.runtime.onMessage.addListener(function (message, sender)
{
	switch (message.event) {
	case 'who_is_who_in_socionics.page_loaded':
		storage.get({paused: false}, data =>
		{
			if (!data.paused) {
				startReplaceServiceInTab(sender.tab.id);
			}
		});
		break;

	case 'who_is_who_in_socionics.replacement_count_updated':
		api.browserAction.setBadgeText({
			text: message.totalReplacedCount > 9999 ? 9999 : message.totalReplacedCount,
			tabId: sender.tab.id
		});
		//api.browserAction.setBadgeBackgroundColor({color: [102, 102, 102, 255]});
	}
});

// When toggling the service, change the icon and update the current tab.
api.browserAction.onClicked.addListener(tab =>
{
	storage.get({paused: false}, function (data)
	{
		if (!data.paused) {
			storage.set({paused: true});
			stopReplaceServiceInTab(tab.id);
			api.browserAction.setIcon({path: {48: "ui/icon-disabled.png"}});
			//api.tabs.reload(tab.id);
		}
		else {
			storage.set({paused: false});
			api.browserAction.setIcon({path: {48: "ui/icon.png"}});
			startReplaceServiceInTab(tab.id);
		}
	});
});
