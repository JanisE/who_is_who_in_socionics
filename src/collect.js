function collectLabels (jqSet)
{
	const people = [];

	jqSet.each(function () {
		people.push(this.getAttribute('aria-label'));
	});
	people.sort((a, b) => a.localeCompare(b, 'lv', {sensitivity: 'accent'}));

	return people;
}

function doCollectTypes (onDone)
{
	const poll = $('div[data-testid="post_message"]').parent().find('.mtm');
	const pollOptions = poll.find('input[type="checkbox"][aria-label]');

	if (pollOptions.length < 1) {
		onDone({collected: false});
	}
	else {
		const collection = {};
		const requests = [];

		pollOptions.each(function () {
			const typeName = this.getAttribute('aria-label');
			const pollItem = $(this.parentNode.parentNode.parentNode);

			const votersLink = pollItem.find('a[href^="/browse/option_voters"]');
			if (votersLink.length > 0) {
				requests.push(
					$.ajax({
						url: votersLink.prop('href')
					})
					.done((votersHtml) => {
						collection[typeName] = collectLabels($(votersHtml).find('.fbProfileBrowser img[aria-label]'));
					})
				)
			}
			else {
				collection[typeName] = collectLabels(pollItem.find('ul:first a[aria-label]'));
			}
		});

		$.when.apply($, requests)
		.done(() => {
			let output = '';

			// Collecting stats is a non-documented side-task of the plug-in. Just adding it here for convenience.
			const stats = {};

			let types = Object.keys(collection);
			types.sort();

			types.forEach(typeName => {
				output += typeName.toLowerCase() + "\n";

				// Normalisation is based on a specific need of the majority of the intended users (Facebook group "Tipi satiekas").
				// In other cases, it will almost never have any effect anyway.
				const normalisedTypeName = typeName.replace('Iepazīties atvērts ', '');
				if (!stats[normalisedTypeName]) {
					stats[normalisedTypeName] = {};
				}

				collection[typeName].forEach(voter_name => {
					output += '* ' + voter_name + "\n";
					stats[normalisedTypeName][voter_name] = true;
				});
				output += "\n";
			});

			const statsOutput = {};
			Object.keys(stats).forEach(normalisedTypeName => {
				statsOutput[normalisedTypeName] = Object.keys(stats[normalisedTypeName]).length;
			});

			console.log(JSON.stringify(statsOutput)); // Do leave this info in the console log.

			api.runtime.sendMessage({
				event: 'who_is_who_in_socionics.autoloaded_sociotypes_updated',
				data: output
			}, function ()
			{
				onDone({collected: true});
			});
		});
	}
}

api.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	switch (message.event) {
	case 'who_is_who_in_socionics.collection_is_requested':
		doCollectTypes(sendResponse);
		break;
	}

	return true;
});
