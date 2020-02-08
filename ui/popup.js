const api = chrome;

function translate (element, tag)
{
	element.textContent = element.textContent.replace('{' + tag + '}', chrome.i18n.getMessage(tag));
}

// Fill in translatable texts.
translate(document.querySelector('.load_from_poll button'), 'Load');
translate(document.querySelector('.load_from_poll .progress_indicator'), 'Loading');
translate(document.querySelector('label[for="service_disabled"]'), 'Paused');
translate(document.querySelector('label[for="service_enabled"]'), 'Running');
translate(document.querySelector('.load_from_poll .label'), 'LoadDataFromFacebookPoll');
translate(document.querySelector('.load_from_poll .poll_not_found'), 'PollNotFound');
translate(document.querySelector('.load_from_poll .open_poll_then_load'), 'OpenPollThenLoad');

// Data loader from poll.
document.querySelector('.load_from_poll button').addEventListener('click', () =>
{
	document.querySelector('.load_from_poll button').classList.add('hidden');
	document.querySelector('.load_from_poll .error_message').classList.add('hidden');
	document.querySelector('.load_from_poll .progress_indicator').classList.remove('hidden');

	api.tabs.query({active: true, currentWindow: true}, function (tabs)
	{
		api.tabs.sendMessage(tabs[0].id, {event: 'who_is_who_in_socionics.collection_is_requested'}, function (response) {
			if (response.collected) {
				window.close()
			}
			else {
				document.querySelector('.load_from_poll .label').classList.add('hidden');
				document.querySelector('.load_from_poll .progress_indicator').classList.add('hidden');
				document.querySelector('.load_from_poll .error_message').classList.remove('hidden');
			}
		});
	});
});

document.querySelector('#service_enabled').addEventListener('click', () =>
{
	// Tell the background script to enable the service.
	api.runtime.sendMessage({event: 'who_is_who_in_socionics.service_enabled'}, function () {window.close()});
});

document.querySelector('#service_disabled').addEventListener('click', () =>
{
	// Tell the background script to disable the service.
	api.runtime.sendMessage({event: 'who_is_who_in_socionics.service_disabled'}, function () {window.close()});
});

// Ask the background script the status of the service.
api.runtime.sendMessage({event: 'who_is_who_in_socionics.popup_loaded'}, function (response) {
	document.querySelector('#service_enabled').checked = !response.paused;
	document.querySelector('#service_disabled').checked = !!response.paused;
});
