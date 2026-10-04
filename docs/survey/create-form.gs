/**
 * Spare Key: how did it go?
 *
 * Creates the optional first-use survey as a Google Form, with a spreadsheet
 * for the answers and a Scores sheet that works out the Net Promoter Score and
 * the System Usability Scale (SUS) score for each answer, and the averages.
 *
 * To use:
 *  1. Go to https://script.google.com and choose New project.
 *  2. Replace everything in the editor with this file, and save.
 *  3. Choose createForm in the function list at the top, then Run.
 *     Google asks you to allow access to Forms, Sheets and Drive: allow it.
 *  4. Open View, Logs (or Execution log). Copy the line starting "Prefilled link"
 *     and send it to Claude, who adds it to Spare Key.
 *
 * The form collects no names or email addresses, and doesn't need a Google account.
 *
 * SUS: John Brooke, "SUS: a quick and dirty usability scale" (1996). Free to use
 * with acknowledgement. "System" is replaced with "Spare Key", as is usual.
 */

var SUS = [
  'I think that I would like to use Spare Key frequently.',
  'I found Spare Key unnecessarily complex.',
  'I thought Spare Key was easy to use.',
  'I think that I would need the support of a technical person to be able to use Spare Key.',
  'I found the various functions in Spare Key were well integrated.',
  'I thought there was too much inconsistency in Spare Key.',
  'I would imagine that most people would learn to use Spare Key very quickly.',
  'I found Spare Key very cumbersome to use.',
  'I felt very confident using Spare Key.',
  'I needed to learn a lot of things before I could get going with Spare Key.'
];

function createForm() {
  var form = FormApp.create('Spare Key: how did it go?');
  form.setDescription('Two minutes, and every question is optional except the first. ' +
    'We don’t ask for your name or email, and nothing you entered in Spare Key is sent with it.');
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('Thank you. It helps us decide what to fix first.');

  var nps = form.addScaleItem()
    .setTitle('How likely are you to recommend Spare Key to someone who builds or looks after websites?')
    .setBounds(0, 10)
    .setLabels('Not at all likely', 'Extremely likely')
    .setRequired(true);

  form.addParagraphTextItem().setTitle('What’s the main reason for your score?');

  form.addMultipleChoiceItem()
    .setTitle('Which describes you best?')
    .setChoiceValues(['I build websites for other people', 'I own or run a website', 'Both', 'Something else']);

  form.addPageBreakItem()
    .setTitle('How easy was it?')
    .setHelpText('Ten short statements. For each one, choose 1 if you strongly disagree and 5 if you strongly agree. Go with your first reaction.');

  var grid = form.addGridItem()
    .setTitle('How much do you agree?')
    .setHelpText('1 = strongly disagree, 5 = strongly agree')
    .setRows(SUS)
    .setColumns(['1', '2', '3', '4', '5']);

  form.addPageBreakItem().setTitle('Anything else');
  form.addParagraphTextItem().setTitle('Anything that didn’t work, or that you expected and didn’t find?');
  var version = form.addTextItem()
    .setTitle('Spare Key version')
    .setHelpText('Filled in for you, so we know which release you used.');

  // Answers spreadsheet, plus a Scores sheet that the script fills in on each answer.
  var ss = SpreadsheetApp.create('Spare Key survey answers');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var scores = ss.insertSheet('Scores');
  scores.getRange('A1:E1').setValues([['Answered', 'Version', 'Recommend (0–10)', 'Group', 'SUS score (0–100)']]);
  scores.getRange('G1:H6').setValues([
    ['Summary', ''],
    ['Answers', '=COUNTA(A2:A)'],
    ['Net Promoter Score', '=IF(COUNTA(D2:D)=0,"",ROUND(100*(COUNTIF(D2:D,"Promoter")-COUNTIF(D2:D,"Detractor"))/COUNTA(D2:D)))'],
    ['Average SUS score', '=IF(COUNT(E2:E)=0,"",ROUND(AVERAGE(E2:E),1))'],
    ['SUS answers', '=COUNT(E2:E)'],
    ['', 'An average SUS score is about 68. Above 80 is very good.']
  ]);
  scores.setFrozenRows(1);

  PropertiesService.getScriptProperties().setProperties({
    sheetId: ss.getId(), npsId: String(nps.getId()), gridId: String(grid.getId()), versionId: String(version.getId())
  });
  ScriptApp.newTrigger('onAnswer').forForm(form).onFormSubmit().create();

  logLinks(form, version, ss);
}

// Prints the links. Run this on its own to see them again, without making a new form.
function showLinks() {
  var t = ScriptApp.getProjectTriggers()[0];
  if (!t) { Logger.log('No form yet: run createForm first.'); return; }
  var form = FormApp.openById(t.getTriggerSourceId());
  var p = PropertiesService.getScriptProperties().getProperties();
  logLinks(form, form.getItemById(Number(p.versionId)).asTextItem(), SpreadsheetApp.openById(p.sheetId));
}

function logLinks(form, version, ss) {
  var prefilled = form.createResponse()
    .withItemResponse(version.createResponse('VERSION'))
    .toPrefilledUrl();
  Logger.log('Form to share: ' + form.getPublishedUrl());
  Logger.log('Prefilled link: ' + prefilled);
  Logger.log('Edit the form: ' + form.getEditUrl());
  Logger.log('Answers: ' + ss.getUrl());
}

// Works out the scores for each answer as it arrives.
function onAnswer(e) {
  var p = PropertiesService.getScriptProperties().getProperties();
  var nps = '', sus = '', version = '';
  e.response.getItemResponses().forEach(function (r) {
    var id = String(r.getItem().getId());
    if (id === p.npsId) nps = Number(r.getResponse());
    if (id === p.versionId) version = r.getResponse();
    if (id === p.gridId) {
      var a = r.getResponse(); // one answer per statement, '1' to '5', or null
      if (a.every(function (x) { return x; })) {
        var total = 0;
        a.forEach(function (x, i) { var n = Number(x); total += i % 2 === 0 ? n - 1 : 5 - n; });
        sus = total * 2.5;
      }
    }
  });
  var group = nps === '' ? '' : nps >= 9 ? 'Promoter' : nps >= 7 ? 'Passive' : 'Detractor';
  SpreadsheetApp.openById(p.sheetId).getSheetByName('Scores')
    .appendRow([e.response.getTimestamp(), version, nps, group, sus]);
}
