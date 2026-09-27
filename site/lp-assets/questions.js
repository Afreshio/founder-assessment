// Question banks, kept free of DOM code so node tests can score answers the same way the pages do.
// Each item is [id, group, statement].

function groupItems(items) {
  return items.reduce((groups, [id, group]) => {
    (groups[group] ||= []).push(id);
    return groups;
  }, {});
}

// Asked on every owner page so leads from each ad cell can be compared on the same "qualified" test.
export const OWNER_ROLES = [
  'I own a business with a team',
  'I own a business, just me',
  'I am a startup founder',
  'I lead a team inside a company',
  'Something else',
];
export const QUALIFIED_OWNER_ROLES = ['I own a business with a team', 'I am a startup founder'];

// Full Power check.
// Voltage items are worded so a higher answer means more supply; resistor items so higher means more resistance.
export const POWER_ITEMS = [
  ['f1', 'fear', 'There is a decision or conversation I know I need to have, and I keep putting it off.'],
  ['s1', 'resentment', 'I feel like I am carrying more than my share, and it quietly bothers me.'],
  ['v1', 'voltage', 'I start the day with enough energy for my most important work.'],
  ['a1', 'anger', 'Small things set me off more than they should.'],
  ['f2', 'fear', 'I hold back on pricing, selling, or asking for what the business needs because of how people might react.'],
  ['s2', 'resentment', 'There is someone in my work life I am quietly keeping score with.'],
  ['v2', 'voltage', 'Most nights, I get the sleep I need.'],
  ['a2', 'anger', 'I send messages or have conversations I later wish I had handled more calmly.'],
  ['f3', 'fear', 'I do the safe, busy work first and push back the work that would actually move the business.'],
  ['s3', 'resentment', 'I replay situations where I felt let down or taken advantage of.'],
  ['v3', 'voltage', 'When pressure spikes, I have a reliable way to reset in a minute or two.'],
  ['a3', 'anger', 'People around me seem careful about bringing me bad news.'],
];

export const POWER_GROUPS = groupItems(POWER_ITEMS);

// Career Campaign Scorecard: the five pillars from afresh.io/career-transition.
export const CAREER_ITEMS = [
  ['t1', 'target', 'I can name the exact role, level and type of company I want next.'],
  ['s1', 'story', 'I can explain my career story, and why this next move makes sense, in under a minute.'],
  ['n1', 'network', 'I have a list of specific people who could introduce me to the companies I want.'],
  ['p1', 'pipeline', 'I track every opportunity with a clear next step and a date.'],
  ['e1', 'energy', 'I have a weekly rhythm for my search that I can keep even on a bad week.'],
  ['t2', 'target', 'I know what pay and package would make a move worth it.'],
  ['s2', 'story', 'My resume and LinkedIn show the level I actually operate at, not just my current title.'],
  ['n2', 'network', 'I have had at least two useful career conversations in the last two weeks.'],
  ['p2', 'pipeline', 'Most of my opportunities come from people and referrals, not cold applications.'],
  ['e2', 'energy', 'A rejection does not knock me off course for more than a day or so.'],
];

export const CAREER_GROUPS = groupItems(CAREER_ITEMS);
