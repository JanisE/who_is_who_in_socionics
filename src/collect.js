function addLabels (collection, edges)
{
	edges.forEach(edge => {
		collection.push(edge.node.name);
	});

	collection.sort((a, b) => a.localeCompare(b, 'lv', {sensitivity: 'accent'}));
}

function injectScript (source)
{
	const script = document.createElement('script');
	script.type = 'text/javascript';
	script.innerHTML = source;
	document.documentElement.appendChild(script);
}

function setInfoBox (content)
{
	let infoBox = $('#wiwis_info_box');

	if (infoBox.length < 1) {
		infoBox = $('<div id="wiwis_info_box" style="box-sizing: border-box; position: fixed; top: 0; background : rgba(0, 0, 0, 0.5); width: 100%; height: 100%;">&nbsp;' +
			'<div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); ' +
				'border: 5px solid #aaaaaa; background: #ffffff; width: 400px; height: 200px; padding: 1rem; font-size: 1rem;">' +
			'<button type="button" class="close" style="position: absolute; top: 4px; right: 4px; background: #ffffff; border: 0 none; padding: 0; width: 26px; height: 26px; cursor: pointer;">' +
				'<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAAB30lEQVRIx+2Wyy4DYRTHfy5pH6BTKTZsKlH2LFhLXLrwFFrhBYoVcdmI58BCWJK4LDwCCWVFLVgqYdTmP8n4MjNfp62NOEkz6bl+5/+dc74Df53aYuo7QBbI6H8FuAaeW3moJDAPXAAuUDN+rmRF6TaVYR7YBvqAT+AUuASeJM8AI8A40AncA4vAQSNQrwBfwCuwDqQsUG8CVdksxb2uFcF1C+Ri2GWBK9mW6jXK65Q3QLqBO0/roC4wXU+B3AnGwSYKbUjwloFElGJRcGwY/AQwFVKFSclMx5vyVYgKeAF8BBRIXsaHRtCkeDXpmIX0AZxHYe8CxwGyhM+xFzRp8IKgO1E7OUEBR2W8GnG//gCHIVn7aU06ox6j0yfs1fchxPgdmAX2gEnxjsR7D7F51LfHY7T7hLU6po83yjzqsOi3Gb5/BHwwTxMA6T4wo8yOgAlgNwLSTBRqzi8WTcrWFk4L2iJta4tWN/6WfM3ZRltZoy3XxGgb1mi7tY02VBRfUm5keHfp0K6vfay07HuehmJmVo77PHn9U1KmVQ1ix/IkbQFvyqwU1p+2V3kK2AH6Vd5nWjEqkndrxRjT1CoDC+rRhimh6j1XUHOJ+pSsUE+BxF0TU8CAsSZeAS/8k+gb+T+N0OkWnY4AAAAASUVORK5CYII=" ' +
				'alt="' + api.i18n.getMessage('Close') + '" width="26" height="26" /></button>' +
			'<div class="info_text"></div>' +
			'</div></div>');
		infoBox.find('.close').on('click', () => {infoBox.remove()});
		infoBox.on('click', (e) =>
		{
			if (e.target.id == 'wiwis_info_box') {
				infoBox.remove()
			}
			// Else: Ignore if clicked anywhere else, i.e., anywhere within the popup content.
		});
		$('body').append(infoBox);
	}

	infoBox.find('.info_text').text(content);
}

/**
 * Finds a component in Facebook DOM.
 * If the plug-in stops working, a good idea is to check if this function still works correctly.
 */
function findDomComponent (name)
{
	let component = $();

	switch (name) {
	case 'poll_items_raw':
		component = $('div[role="article"] > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(2) > div:nth-child(1) > div > div > div')
			.children()
		break;
	case 'poll_items':
		component = findDomComponent('poll_items_raw')
			// In some cases in Chrome there were a few odd elements leading the normal option elements. Get rid of those.
			// Also, gets rid of the "see all poll options" button at the buttom.
			.filter(function () {return $(this).find('input[name^="option_"]').length > 0});
		break;
	case 'poll_options':
		component = findDomComponent('poll_items').find('input[name^="option_"]');
		break;
	case 'see_all_poll_items_button':
		component = findDomComponent('poll_items_raw').last().find('> div > [role="button"]');
		break;
	case 'scrollable_voter_list_in_popup':
		component = findDomComponent('voter_list_popup').find('> div:last-child');
		break;
	case 'voter_list_for_first_option_open_button':
		// Note. No semantics in mark-up... We cannot use aria-labels as well, because they get translated.
		// "Link to see everyone"
		component = findDomComponent('poll_items').first().find('> div:last-child > div div[role="row"] > div:last-child div[role="button"]');
		break;
	case 'voter_list_popup':
		const popup = $('[role="dialog"]');
		// No way to be certain if the dialog is voter list dialog, but at least ensure there is a progress bar.
		component = popup.find('[role="progressbar"]').length > 0 ? popup : $();
		break;
	case 'voter_list_popup_close_button':
		component = findDomComponent('voter_list_popup').find('> div:nth-child(2) [role="button"]');
		break;

	case 'wiwis_doc_id_refetch':
		component = $('#wiwis_doc_id_refetch');
		break;
	}

	console.log('findDomComponent(' + name + '): ' + (component.length > 0 ? 'found' : 'not found'));

	return component;
}

function waitOnDomComponent (name, onDone, onFail)
{
	const timeout = setTimeout(() =>
	{
		if (waitingOnComponent >= 0) {
			clearInterval(waitingOnComponent);
			if (typeof onFail == 'function') {
				onFail();
			}
		}
	}, 30000); // Fail after 30 s.

	let waitingOnComponent = setInterval(function ()
	{
		const component = findDomComponent(name);
		if (component.length > 0) {
			clearInterval(waitingOnComponent);
			waitingOnComponent = -1;
			clearTimeout(timeout);

			onDone(component);
		}
	}, 400); // 400
}

function getDocId (onDone)
{
	if (!document.getElementById('wiwis_doc_id_refetch')) {
		injectScript('(' + (function listenForIdsInAjaxRequests ()
		{
			if (!document.getElementById('wiwis_doc_id')){
				const original_send = XMLHttpRequest.prototype.send;
				let docIdInitial = null;
				let docIdRefetch = null;
				let fbDtsg = null;

				// Listen for AJAX requests.
				XMLHttpRequest.prototype.send = function() {
					if (arguments[0] && arguments[0].match) {
						if (!docIdInitial) {
							const matchDocId = arguments[0].match(/doc_id=(\d+)/);
							const matchVoter_request = arguments[0].match(/fb_api_req_friendly_name=CometPollVoterDialogQuery/);

							if (matchVoter_request && matchDocId) {
								docIdInitial = matchDocId[1];
							}
						}
						if (!docIdRefetch) {
							const matchDocId = arguments[0].match(/doc_id=(\d+)/);
							const matchVoter_request = arguments[0].match(/fb_api_req_friendly_name=CometPollVoterDialogContentRefetchQuery/);

							if (matchVoter_request && matchDocId) {
								docIdRefetch = matchDocId[1];
							}
						}
						if (!fbDtsg) {
							const matchFbDtsg = arguments[0].match(/fb_dtsg=([\w:%-]+)/);
							if (matchFbDtsg) {
								fbDtsg = decodeURIComponent(matchFbDtsg[1]);
							}
						}
					}

					original_send.apply(this, arguments);

					if (docIdInitial && docIdRefetch) {
						XMLHttpRequest.prototype.send = original_send;

						const pouch = document.createElement('div');
						pouch.id = 'wiwis_data';
						pouch.innerHTML = '<input id="wiwis_doc_id_initial" name="wiwis_doc_id_initial" type="hidden" />' +
							'<input id="wiwis_doc_id_refetch" name="wiwis_doc_id_refetch" type="hidden" />' +
							'<input id="wiwis_fb_dtsg" name="wiwis_fb_dtsg" type="hidden" />';
						pouch.querySelector('#wiwis_doc_id_initial').value = docIdInitial;
						pouch.querySelector('#wiwis_doc_id_refetch').value = docIdRefetch;
						pouch.querySelector('#wiwis_fb_dtsg').value = fbDtsg;

						document.querySelector('body').appendChild(pouch);
					}
				}
			}
			// Else: the values are already found.
		}).toString() + ')()');

		waitOnDomComponent('voter_list_for_first_option_open_button', function (voter_list_button)
		{
			// Opening the voter list initiates AJAX request containing wiwis_doc_id_initial.
			voter_list_button.click();

			waitOnDomComponent('scrollable_voter_list_in_popup', function (scrollableList)
			{
				scrollableList.prop('scrollTop', scrollableList.prop('scrollHeight'));

				// Repeat it several times, in case the pop-up list is not completely ready, yet.
				const keepScrolling = setInterval(function ()
				{
					if (!document.getElementById('wiwis_doc_id_refetch')) {
						// Find the component anew. If the previous scrolling did not work, maybe the wrong element had been found.
						// There were cases when the scrolling seemed to not work, for some reason, although the element was clearly ready.
						const scrollableList = findDomComponent('scrollable_voter_list_in_popup');
						scrollableList.prop('scrollTop', scrollableList.prop('scrollHeight'));
					}
					else {
						clearTimeout(keepScrolling);
					}
				}, 400);
				setTimeout(function ()
				{
					clearTimeout(keepScrolling);
				}, 10000);
			});
		});
	}

	waitOnDomComponent('wiwis_doc_id_refetch', function ()
	{
		onDone(
			document.getElementById('wiwis_doc_id_initial').value,
			document.getElementById('wiwis_doc_id_refetch').value,
			document.getElementById('wiwis_fb_dtsg').value
		);
	})
}

function doCollectTypes (onDone)
{
	// If collapsed vote option list detected, try expanding it.
	if (findDomComponent('see_all_poll_items_button').length > 0) {
		findDomComponent('see_all_poll_items_button').click();
	}

	getDocId(function(docIdInitial, docIdRefetch, fbDtsg) {
		function collectLabels (onDone)
		{
			safetyNet--;
			if (safetyNet <= 0) {
				setInfoBox(api.i18n.getMessage('PollWasTooLarge'));
				onDone(false);
				return;
			}

			if (!paginationInfo.has_next_page) {
				currentOption++;

				if (currentOption >= pollOptions.length) {
					onDone(true);
					return;
				}
				else {
					currentTypeName = pollOptions[currentOption].getAttribute('aria-label');
					collection[currentTypeName] = [];
					setInfoBox(api.i18n.getMessage('GettingVotersFor') + ' "' + currentTypeName + '"...');
				}
			}

			const optionId = pollOptions[currentOption].getAttribute('name').split('_')[1]; // name example = 'option_153379865506091'
			const variables = {
				scale: 1
			};
			if (paginationInfo.has_next_page) {
				variables.count = 10;
				variables.cursor = paginationInfo.end_cursor;
				variables.id = optionId;
			}
			else {
				variables.optionID = optionId;
			}

			$.ajax({
				url: window.location.origin + '/api/graphql',
				method: 'POST',
				dataType: 'json',
				data: {
					fb_dtsg: fbDtsg,
					variables: JSON.stringify(variables),
					doc_id: variables.optionID ? docIdInitial : docIdRefetch
				}
			})
			.done((pollData) => {
				if (pollData.errors && pollData.errors.length > 0) {
					console.error('Error getting voters: ', pollData.errors);
					if(pollData.errors[0].code == 1675004) {
						setInfoBox(api.i18n.getMessage('RequestLimitExceeded'));
					}
					onDone(false);
				}
				else {
					try {
						const voters = pollData.data.question_option ? pollData.data.question_option.profile_voters : pollData.data.node.profile_voters;
						addLabels(collection[currentTypeName], voters.edges);
						paginationInfo = voters.page_info; // E.g. {end_cursor: "AQHRQoadHCEX1V9HZLwPNbaWJewzFu4NfShyKhu5oHUX01X8-gxp8ZSSp6qs-ip_Dxul", has_next_page: true}
						collectLabels(onDone);
					}
					catch (e) {
						console.error('Unexpected voter data structure.', e, pollData);
						setInfoBox(api.i18n.getMessage('ErrorGettingVoters'));
						onDone(false);
					}
				}
			})
			.fail(function () {
				console.error('Error while getting voter data.', arguments);
				setInfoBox(api.i18n.getMessage('ErrorGettingVoters'));
				onDone(false);
			})
		}

		const collection = {};
		let currentOption = -1;
		let safetyNet = 100;
		let currentTypeName;
		let paginationInfo = {has_next_page: false};

		const pollOptions = findDomComponent('poll_options');

		if (pollOptions.length < 1) {
			setInfoBox(api.i18n.getMessage('PollNotFound'));
			onDone({collected: false});
		}
		else {
			collectLabels(function (success) {
				findDomComponent('voter_list_popup_close_button').click(); // Close the pop-up list.

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

				if (success) {
					setInfoBox(api.i18n.getMessage('VotersCollected'));
				}

				// Remove the stored poll IDs, as navigating to another poll would not necessarily reload the page
				// resulting in the wrong IDs being used for the other poll.
				// Do not remove too fast because scrolling voters uses the data to determine whether to continue scrolling.
				$('#wiwis_data').remove();

				api.runtime.sendMessage({
					event: 'who_is_who_in_socionics.autoloaded_sociotypes_updated',
					data: output
				}, function ()
				{
					onDone({collected: true});
				});
			});
		}
	});
}

api.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	switch (message.event) {
	case 'who_is_who_in_socionics.collection_is_requested':
		doCollectTypes(sendResponse);
		// User-interaction with the site during the collection is possible, which would cause the pop-up to close and abort the callback process.
		// So, do not even try sending a response to avoid errors. (Improve this?)
//		sendResponse({collected: true});
//		doCollectTypes();
		break;
	}

	return true;
});
