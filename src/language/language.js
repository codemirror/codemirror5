let reference = [
	'Search:',
	'(Use /re/ syntax for regexp search)',
	'With:',
	'Replace?',
	'Yes',
	'No',
	'All',
	'Stop',
	'Replace:',
	'Replace all:',
	'Replace with:',
	'Jump to line:',
	'(Use line:column or scroll% syntax)',
	'Push to left',
	'Revert chunk',
	'Toggle locked scrolling',
	'Identical text collapsed. Click to expand.',
];

let phrases = {};

export function phrase(phrase)
{
	if (phrases.hasOwnProperty(phrase))
	{
		return phrases[phrase];
	}
	else
	{
		return phrase;
	}
}