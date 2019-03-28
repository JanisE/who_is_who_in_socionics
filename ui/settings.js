const api = chrome;
// Do not use api.storage.sync, because it has a limit of 8 KB per value stored (and 100 KB total limit).
// Local storage limit is 5 MB.
const storage = api.storage.local;

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

function save ()
{
	const sociotypesRaw = document.querySelector('textarea[name="sociotypes"]').value;

	storage.set({
		sociotypes_raw: sociotypesRaw,
		sociotypes_parsed: parseRawInput(sociotypesRaw)
	}, () =>
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
	storage.get(['sociotypes_raw'], data =>
	{
		if (data.sociotypes_raw) {
			document.querySelector('textarea[name="sociotypes"]').value = data.sociotypes_raw;
		}
	});

	// Tell the buttons what to do.
	document.querySelectorAll('.save').forEach(saveButton =>
	{
		saveButton.addEventListener('click', save);
	});

	// Hide the status info upon editing the settings.
	const textarea = document.querySelector('textarea[name="sociotypes"]');
	textarea.addEventListener('keyup', clearStatusMessage);
	textarea.addEventListener('paste', clearStatusMessage);

	// Fill in translatable texts.
	document.title = chrome.i18n.getMessage('Settings') + ' - ' + chrome.i18n.getMessage('AddonName');
	document.querySelector('button.save').textContent = chrome.i18n.getMessage('Save');
	document.querySelector('p').textContent = chrome.i18n.getMessage('Instructions');
	document.querySelector('.info_saved').textContent = chrome.i18n.getMessage('Saved');
	document.querySelector('textarea[name="sociotypes_sample"]').value = chrome.i18n.getMessage('ExampleContent');
	const h3 = document.querySelector('h3');
	h3.textContent = h3.textContent.replace('{Example}', chrome.i18n.getMessage('Example'));
});
