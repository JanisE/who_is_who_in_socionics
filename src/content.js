const api = chrome;

const NODE_LIMIT = 150000;
//const BODY_REPROCESS_INTERVAL = 10000;
const CHUNK_TIME_LIMIT = 300;
const PAUSE_BETWEEN_CHUNKS = 200;
// Note. This is not regexps per chunk. Chunk is done in bits/setTimeouts, and this is regexps per one such bit of the chunk.
const REGEXPS_PER_CHUNK_BIT = 10;

let replacements = [];
let totalReplacedCount = 0;

let serviceRunning = false;
const observeParams = {characterData: true, childList: true, subtree: true};
let bodyObserver = null;
let titleObserver = null;
let bodyProcessorLoop = 0;

let processingQueue = false;
const targetQueue = new Set();



function prepareReplacements (sociotypesParsed)
{
	replacements = sociotypesParsed;

	// Prepare the Regexp objects.
	replacements.forEach((replacement) =>
	{
		replacement.rgFrom = new RegExp(replacement.from, 'g');
	});
}

// Apply all replacements on @param string text.
function performReplacements (text)
{
	let modifiedText = text;
	let replacedCount = 0;

	for (let i = replacements.length - 1; i >= 0; i--) {
		const re = replacements[i].rgFrom;
		const matches = modifiedText.match(re);
		const matchCount = matches ? matches.length : 0;

		if (matchCount > 0) {
			replacedCount += matchCount;
			modifiedText = modifiedText.replace(re, replacements[i].to);
		}
	}

	return {modifiedText, replacedCount};
}

function treeEnqueue (target)
{
	const tree = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);

	let enqueued = 0;

	if (replacements.length > 0) {
		let node;

		while ((node = tree.nextNode()) !== null && enqueued < NODE_LIMIT) {
			if (
				// Avoid rewriting several times.
				!node.wiwis_modified
				// Skip replacing under the active element if it's not the body, since it may interfere with typing.
				&& (document.activeElement.contains(document.body) || !document.activeElement.contains(node))
			) {
				targetQueue.add(node);
				enqueued++;
			}
		}
	}
	// Do not bother, if there is nothing to be replaced.

	//if (enqueued > 0) {
	//	console.info('Nodes enqueued:', enqueued);
	//}
}

function processNextQueueChunk ()
{
	function finishChunk ()
	{
		if (totalReplacedCount > previousReplacedCount) {
			api.runtime.sendMessage({event: 'who_is_who_in_socionics.replacement_count_updated', totalReplacedCount});
		}

		//console.info('Processed nodes in a chunk =', processedInChunk);
		//console.timeEnd('processNextQueueChunk');

		if (targetQueue.size <= 0) {
			processingQueue = false;
		}
		else {
			setTimeout(processNextQueueChunk, PAUSE_BETWEEN_CHUNKS);
		}
	}

	function processNextQueueTargets ()
	{
		// One regexp per `setTimeout` was too slow.
		for (let i = REGEXPS_PER_CHUNK_BIT; i > 0; i--) {
			if (targetQueue.size <= 0) {
				break;
			}
			else {
				let node = targetQueue.values().next().value;
				const {modifiedText, replacedCount} = performReplacements(node.nodeValue);

				if (replacedCount > 0) {
					totalReplacedCount += replacedCount;
					node.wiwis_modified = true;
					node.nodeValue = modifiedText;
				}

				targetQueue.delete(node);
				processedInChunk++;
			}
		}

		// Actually, the time was up at the beginning of `processNextQueueTargets`,
		// but check it here, to not split the code.
		if (chunkTimeIsUp || targetQueue.size <= 0) {
			finishChunk();
		}
		else {
			// Go to next. Do not block other scripts.
			setTimeout(processNextQueueTargets, 0);
		}
	}

	//console.time('processNextQueueChunk');

	const previousReplacedCount = totalReplacedCount;
	let processedInChunk = 0;

	let chunkTimeIsUp = false;
	setTimeout(() => chunkTimeIsUp = true, CHUNK_TIME_LIMIT);

	processNextQueueTargets();
}

function startProcessingQueue ()
{
	if (!processingQueue) {
		processingQueue = true;

		processNextQueueChunk();
	}
	// Else skip new requests. Most probably made while observing our own changes.
	// For other cases, the `processBody` is run once per 5 s.
}

function observeTitle ()
{
	titleObserver = new MutationObserver(() =>
	{
		titleObserver.disconnect();
		document.title = performReplacements(document.title).modifiedText;
		titleObserver.observe(document.querySelector('title'), observeParams);
	});

	titleObserver.observe(document.querySelector('title'), observeParams);
}

function processBody ()
{
	treeEnqueue(document.body);
	startProcessingQueue();
}

function startReplacementService (sociotypesParsed)
{
	if (serviceRunning) {
		stopReplacementService();
	}

	serviceRunning = true;

	prepareReplacements(sociotypesParsed);

	document.title = performReplacements(document.title).modifiedText;
	observeTitle();

	processBody();

	// Watch the body.
	bodyObserver = new MutationObserver(mutations =>
	{
		for (let i = 0; i < mutations.length; i++) {
			switch (mutations[i].type) {
			case 'characterData':
				treeEnqueue(mutations[i].target);
				break;
			case 'childList':
				for (let c = mutations[i].addedNodes.length - 1; c >= 0; c--) {
					treeEnqueue(mutations[i].addedNodes[c]);
				}
				break;
			}
		}

		startProcessingQueue();
	});

	bodyObserver.observe(document.body, observeParams);

	// Re-process everything, in case changes happened while `processingQueue` was on, discarding new calls.
	// Or just in any case.
	// Disabled this, because the script may be too slow. No need of running it continuously
	// if it is not giving any benefit anyway (probably).
	//	bodyProcessorLoop = setInterval(() =>
	//	{
	//		if (targetQueue.size <= 0) {
	//			processBody();
	//		}
	//		// Else: Let the queue run out before restarting it.
	//	}, BODY_REPROCESS_INTERVAL);
}

function stopReplacementService ()
{
	serviceRunning = false;

	clearInterval(bodyProcessorLoop);

	if (titleObserver) {
		titleObserver.disconnect();
		titleObserver = null;
	}

	if (bodyObserver) {
		bodyObserver.disconnect();
		bodyObserver = null;
	}

	targetQueue.clear();
}



api.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	switch (message.event) {
	case 'who_is_who_in_socionics.service_is_enabled':
		startReplacementService(message.sociotypes_parsed);
		sendResponse();
		break;
	case 'who_is_who_in_socionics.service_is_disabled':
		stopReplacementService();
		sendResponse();
	}
});

// Tell the background script a content page has loaded.
api.runtime.sendMessage({event: 'who_is_who_in_socionics.page_loaded'});
