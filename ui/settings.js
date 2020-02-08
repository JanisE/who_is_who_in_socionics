const api = chrome;
// Do not use api.storage.sync, because it has a limit of 8 KB per value stored (and 100 KB total limit).
// Local storage limit is 5 MB.
const storage = api.storage.local;

function translate (element, tag)
{
	element.textContent = element.textContent.replace('{' + tag + '}', chrome.i18n.getMessage(tag));
}

function save ()
{
	const sociotypesRaw = document.querySelector('textarea[name="sociotypes"]').value;

	api.runtime.sendMessage({
		event: 'who_is_who_in_socionics.sociotypes_updated',
		data: sociotypesRaw
	}, function ()
	{
		// Display message for Firefox (because cannot close the settings window).
		document.querySelector('.info_saved').classList.remove('hidden');
		window.close(); // Close the window for Chrome.
	});
}

function clearStatusMessage ()
{
	document.querySelector('.info_saved').classList.add('hidden');
}

// When the settings is open:
document.addEventListener('DOMContentLoaded', () =>
{
	// Fill in the type list.
	storage.get(['sociotypes_raw', 'sociotypes_autoloaded_raw'], data =>
	{
		if (data.sociotypes_raw) {
			document.querySelector('textarea[name="sociotypes"]').value = data.sociotypes_raw;
		}
		if (data.sociotypes_autoloaded_raw) {
			document.querySelector('textarea[name="sociotypes_autoloaded"]').value = data.sociotypes_autoloaded_raw;
		}
	});

	// Tell the buttons what to do.
	document.querySelectorAll('.save').forEach(saveButton =>
	{
		saveButton.addEventListener('click', save);
	});
	document.querySelector('button.clear').addEventListener('click', function ()
	{
		api.runtime.sendMessage({
			event: 'who_is_who_in_socionics.autoloaded_sociotypes_updated',
			data: ''
		}, function ()
		{
			document.querySelector('textarea[name="sociotypes_autoloaded"]').value = '';
		});
	});

	// Hide the status info upon editing the settings.
	const textarea = document.querySelector('textarea[name="sociotypes"]');
	textarea.addEventListener('keyup', clearStatusMessage);
	textarea.addEventListener('paste', clearStatusMessage);

	// Fill in translatable texts.
	document.title = chrome.i18n.getMessage('Settings') + ' - ' + chrome.i18n.getMessage('AddonName');
	document.querySelector('textarea[name="sociotypes_sample"]').value = chrome.i18n.getMessage('ExampleContent');
	translate(document.querySelector('button.clear'), 'Clear');
	translate(document.querySelector('button.save'), 'Save');
	translate(document.querySelector('p'), 'Instructions');
	translate(document.querySelector('.info_saved'), 'Saved');
	translate(document.querySelector('.label_sociotypes_autoloaded'), 'AutoloadedTypes');
	translate(document.querySelector('h3'), 'Example');
});
